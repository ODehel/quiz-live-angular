<#
.SYNOPSIS
    Smoke test de l'etat vide de la liste des themes (/themes) contre un vrai hub.
.DESCRIPTION
    L'etat vide (CA-4) n'existe que si le hub n'a AUCUN theme. Ce script prepare et controle cet etat.
    Sans option : il se connecte, lit la liste et verifie qu'elle est vide. Si elle ne l'est pas, il liste
    les themes presents et s'arrete (il ne supprime jamais rien sans -ClearThemes).
    -ClearThemes : supprime TOUS les themes du hub (irreversible : a n'utiliser que sur une base de test),
                   puis verifie que la liste est vide.
    -SeedOne     : cree un seul theme (Geographie, avec accent) pour verifier le retour a la grille.
    -Cleanup     : supprime le theme cree par -SeedOne (et lui seul), puis s'arrete.
    Si `npm start` tourne, relit aussi la liste a travers le proxy d'Angular (/api -> hub).
    Affiche ensuite ce qu'il faut voir dans le navigateur sur /themes.
    Ecrit le compte rendu dans -OutFile (par defaut smoke-test-summary.txt, dossier courant).
    Script en ASCII : l'accent du theme est construit par code de caractere, pour que Windows
    PowerShell 5.1 ne l'abime pas. Compatible PowerShell 5.1 et 7.
.PARAMETER BaseUrl
    Adresse du hub. Defaut : http://localhost:3000
.PARAMETER AngularUrl
    Adresse du serveur de dev Angular (npm start). Defaut : http://localhost:4200
.PARAMETER Password
    Mot de passe admin du hub. Defaut : dev-password (celui de environment.development.ts).
.EXAMPLE
    .\scripts\smoke-themes-empty-state.ps1 -ClearThemes
    .\scripts\smoke-themes-empty-state.ps1 -SeedOne
    .\scripts\smoke-themes-empty-state.ps1 -Cleanup
    # Si la politique d'execution bloque le script (valable pour ce seul processus) :
    powershell -ExecutionPolicy Bypass -File .\scripts\smoke-themes-empty-state.ps1 -ClearThemes
#>
param(
    [string]$BaseUrl = 'http://localhost:3000',
    [string]$AngularUrl = 'http://localhost:4200',
    [string]$Username = 'admin',
    [string]$Password = 'dev-password',
    [string]$OutFile = 'smoke-test-summary.txt',
    [switch]$ClearThemes,
    [switch]$SeedOne,
    [switch]$Cleanup
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$utf8 = New-Object System.Text.UTF8Encoding($false)
$BaseUrl = $BaseUrl.TrimEnd('/')
$AngularUrl = $AngularUrl.TrimEnd('/')

$SeedName = "G$([char]0xE9)ographie"
$ListPath = '/api/v1/themes?page=1&limit=100'
$script:Lines = New-Object System.Collections.Generic.List[string]
$script:Fail = 0

function Log([string]$Text, [string]$Color = 'Gray') {
    $script:Lines.Add($Text)
    Write-Host $Text -ForegroundColor $Color
}

function Check([string]$Label, [bool]$Condition, [string]$Detail = '') {
    if ($Condition) { Log "[PASS] $Label" 'Green' }
    else {
        $script:Fail++
        Log "[FAIL] $Label" 'Red'
        if ($Detail) { Log "       recu : $Detail" 'Red' }
    }
}

function Invoke-Api {
    param([string]$Root, [string]$Method, [string]$Path, [string]$Body = $null, [string]$Token = '')
    $tmp = [System.IO.Path]::GetTempPath()
    $uid = [guid]::NewGuid().ToString('N')
    $bodyOut = Join-Path $tmp "smoke-$uid.out"
    $bodyIn = Join-Path $tmp "smoke-$uid.in"
    $curlArgs = @('-s', '-S', '-X', $Method, ($Root + $Path), '-o', $bodyOut, '-w', '%{http_code}')
    if ($Token) { $curlArgs += @('-H', "Authorization: Bearer $Token") }
    if ($PSBoundParameters.ContainsKey('Body')) {
        [System.IO.File]::WriteAllText($bodyIn, $Body, $utf8)
        $curlArgs += @('-H', 'Content-Type: application/json', '--data-binary', "@$bodyIn")
    }
    $code = & curl.exe @curlArgs
    if ($LASTEXITCODE -ne 0) { throw "curl.exe a echoue (code $LASTEXITCODE) sur $Method $Root$Path" }
    $json = $null
    if (Test-Path $bodyOut) {
        $raw = [System.IO.File]::ReadAllText($bodyOut, $utf8)
        Remove-Item $bodyOut -Force
        if ($raw) { $json = $raw | ConvertFrom-Json }
    }
    if (Test-Path $bodyIn) { Remove-Item $bodyIn -Force }
    return [pscustomobject]@{ Status = [int]$code; Json = $json }
}

function Save-Report {
    [System.IO.File]::WriteAllLines($OutFile, $script:Lines, $utf8)
    Write-Host "Compte rendu ecrit dans $OutFile" -ForegroundColor DarkGray
}

try {
    Log "== Connexion au hub ($BaseUrl)" 'Cyan'
    $login = Invoke-Api -Root $BaseUrl -Method POST -Path '/api/v1/token' `
        -Body (@{ username = $Username; password = $Password } | ConvertTo-Json -Compress)
    Check "POST /api/v1/token -> 200" ($login.Status -eq 200) "statut $($login.Status) (401 = ADMIN_PASSWORD du hub different de '$Password')"
    if ($login.Status -ne 200) { throw 'Connexion impossible : arret.' }
    $token = $login.Json.token

    if ($Cleanup) {
        Log ''
        Log "== Nettoyage du theme $SeedName cree par -SeedOne" 'Cyan'
        $all = Invoke-Api -Root $BaseUrl -Method GET -Path $ListPath -Token $token
        $seeded = @($all.Json.data | Where-Object { $_ -and $_.name -eq $SeedName })
        if ($seeded.Count -eq 0) { Log "[SKIP] $SeedName : absent" }
        foreach ($theme in $seeded) {
            $del = Invoke-Api -Root $BaseUrl -Method DELETE -Path "/api/v1/themes/$($theme.id)" -Token $token
            Check "DELETE $($theme.name) -> 204" ($del.Status -eq 204) "statut $($del.Status)"
        }
        return
    }

    Log ''
    Log '== Etat du hub' 'Cyan'
    $current = Invoke-Api -Root $BaseUrl -Method GET -Path $ListPath -Token $token
    Check 'GET liste -> 200' ($current.Status -eq 200) "statut $($current.Status)"
    $present = @($current.Json.data | Where-Object { $_ })

    if ($ClearThemes) {
        Log ''
        Log "== Suppression de TOUS les themes ($($present.Count))" 'Yellow'
        foreach ($theme in $present) {
            $del = Invoke-Api -Root $BaseUrl -Method DELETE -Path "/api/v1/themes/$($theme.id)" -Token $token
            Check "DELETE $($theme.name) -> 204" ($del.Status -eq 204) "statut $($del.Status) (409 = le theme contient des questions)"
        }
    }

    if ($SeedOne) {
        Log ''
        Log "== Creation d'un seul theme ($SeedName)" 'Cyan'
        $afterClear = Invoke-Api -Root $BaseUrl -Method GET -Path $ListPath -Token $token
        if (@($afterClear.Json.data | Where-Object { $_ }).Count -gt 0) {
            Log "[SKIP] le hub a deja des themes : -SeedOne n'en cree pas de plus." 'Yellow'
        }
        else {
            $created = Invoke-Api -Root $BaseUrl -Method POST -Path '/api/v1/themes' `
                -Body (@{ name = $SeedName } | ConvertTo-Json -Compress) -Token $token
            Check "POST $SeedName -> 201" ($created.Status -eq 201) "statut $($created.Status)"
        }
    }

    Log ''
    Log '== Liste cote hub' 'Cyan'
    $hub = Invoke-Api -Root $BaseUrl -Method GET -Path $ListPath -Token $token
    $hubCount = @($hub.Json.data | Where-Object { $_ }).Count
    Check 'GET liste -> 200' ($hub.Status -eq 200) "statut $($hub.Status)"
    if ($SeedOne) {
        Check 'la liste contient exactement 1 theme' (($hubCount -eq 1) -and ($hub.Json.total -eq 1)) "total $($hub.Json.total), renvoyes $hubCount"
    }
    else {
        Check 'la liste est vide (total 0, aucun theme renvoye)' (($hubCount -eq 0) -and ($hub.Json.total -eq 0)) "total $($hub.Json.total), renvoyes $hubCount : $((@($hub.Json.data | ForEach-Object { $_.name })) -join ', ')"
        if ($hubCount -gt 0) { Log "Relance avec -ClearThemes pour les supprimer (IRREVERSIBLE) ou lance le test sur une base vide." 'Yellow' }
    }

    Log ''
    Log "== Liste a travers le proxy d'Angular ($AngularUrl)" 'Cyan'
    try {
        $proxied = Invoke-Api -Root $AngularUrl -Method GET -Path $ListPath -Token $token
        Check 'proxy /api -> hub : meme total' ($proxied.Json.total -eq $hub.Json.total) "total $($proxied.Json.total)"
    }
    catch {
        Log "[SKIP] npm start ne tourne pas sur $AngularUrl : lance-le puis relance ce script." 'Yellow'
    }

    Log ''
    Log '== A verifier dans le navigateur' 'Cyan'
    Log "Ouvre $AngularUrl/themes (hub et npm start lances), console du navigateur ouverte."
    if ($SeedOne) {
        Log '  Cas 1 theme (retour a la grille) :'
        Log "  1. Pastille a cote du titre : '1 au total'"
        Log "  2. UNE carte 'G$([char]0xE9)ographie' ; AUCUNE boite pointillee, AUCUN texte 'Aucun theme'"
        Log '  3. Un seul bouton Nouveau theme, a droite du titre'
    }
    else {
        Log '  Cas 0 theme (etat vide) :'
        Log "  1. Titre : Themes. AUCUNE pastille '0 au total' a cote du titre"
        Log "  2. Bouton violet Nouveau theme toujours a droite du titre (en-tete)"
        Log "  3. Dessous : une boite aux bords POINTILLES, centree, avec une icone de dossier grise,"
        Log "     le texte 'Aucun theme - creez votre premier theme' (accents et tiret long lisibles :"
        Log "     e accent grave dans theme, e accent aigu dans creez)"
        Log "     et, DESSOUS le texte, un second bouton violet Nouveau theme CENTRE (pas colle a droite)"
        Log '  4. Aucune grille de cartes vide'
        Log "  5. Clique sur le bouton DE LA BOITE : la modale 'Nouveau theme' s'ouvre, le curseur est dans"
        Log "     le champ 'Nom du theme' ; Echap la ferme ; rouvre-la avec le bouton de l'en-tete : meme modale"
        Log '  6. Onglet Network : une seule requete GET /api/v1/themes?page=1&limit=100, statut 200'
        Log '  Cas liste en echec (hub eteint : jamais d invitation) :'
        Log "  7. Arrete le hub (Ctrl+C dans son terminal), recharge $AngularUrl/themes :"
        Log "     la page n'affiche que le titre et le bouton de l'en-tete ; SURTOUT PAS le texte 'Aucun theme'"
        Log "     (une erreur dans la console est attendue : dette connue, la liste en echec reste muette)"
        Log '  8. Relance le hub avant de passer a la suite'
        Log "  Pour voir le retour a la grille : .\scripts\smoke-themes-empty-state.ps1 -SeedOne puis recharge la page ;"
        Log "  nettoyage : .\scripts\smoke-themes-empty-state.ps1 -Cleanup"
    }
}
finally {
    Log ''
    Log "Echecs : $script:Fail" $(if ($script:Fail -eq 0) { 'Green' } else { 'Red' })
    Save-Report
}
if ($script:Fail -gt 0) { exit 1 }
