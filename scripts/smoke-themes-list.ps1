<#
.SYNOPSIS
    Smoke test de la liste des themes (/themes) contre un vrai hub.
.DESCRIPTION
    1. Se connecte au hub et cree les themes absents (Geographie, Histoire, Cinema, Musique).
    2. Renomme Musique en Musique classique (seul moyen d'avoir une date de modification).
    3. Lit la liste cote hub (GET /api/v1/themes?page=1&limit=100) et verifie total, noms et dates.
    4. Si `npm start` tourne, relit la meme liste a travers le proxy d'Angular (/api -> hub).
    5. Affiche ce qu'il faut voir dans le navigateur sur /themes, dates comprises.
    Avec -Cleanup : supprime les themes crees par ce script, puis s'arrete.
    Ecrit le compte rendu dans -OutFile (par defaut smoke-test-summary.txt, dossier courant).
    Script en ASCII : les accents des noms sont construits par code de caractere, pour que
    Windows PowerShell 5.1 ne les abime pas. Compatible PowerShell 5.1 et 7.
.PARAMETER BaseUrl
    Adresse du hub. Defaut : http://localhost:3000
.PARAMETER AngularUrl
    Adresse du serveur de dev Angular (npm start). Defaut : http://localhost:4200
.PARAMETER Password
    Mot de passe admin du hub. Defaut : dev-password (celui de environment.development.ts).
.EXAMPLE
    .\scripts\smoke-themes-list.ps1
    .\scripts\smoke-themes-list.ps1 -Cleanup
    # Si la politique d'execution bloque le script (valable pour ce seul processus) :
    powershell -ExecutionPolicy Bypass -File .\scripts\smoke-themes-list.ps1
#>
param(
    [string]$BaseUrl = 'http://localhost:3000',
    [string]$AngularUrl = 'http://localhost:4200',
    [string]$Username = 'admin',
    [string]$Password = 'dev-password',
    [string]$OutFile = 'smoke-test-summary.txt',
    [switch]$Cleanup
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$utf8 = New-Object System.Text.UTF8Encoding($false)
$BaseUrl = $BaseUrl.TrimEnd('/')
$AngularUrl = $AngularUrl.TrimEnd('/')

$Names = @("G$([char]0xE9)ographie", 'Histoire', "Cin$([char]0xE9)ma", 'Musique')
$Renamed = 'Musique classique'
$Expected = @("G$([char]0xE9)ographie", 'Histoire', "Cin$([char]0xE9)ma", $Renamed)
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

function Format-Day($Value) {
    # PowerShell 7 rend deja un [datetime] ; PowerShell 5.1 rend la chaine ISO du hub (UTC).
    if ($Value -is [datetime]) { $day = $Value.ToLocalTime() }
    else { $day = ([datetimeoffset]::Parse([string]$Value, [Globalization.CultureInfo]::InvariantCulture)).LocalDateTime }
    return $day.ToString('dd/MM/yyyy', [Globalization.CultureInfo]::InvariantCulture)
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
        Log '== Nettoyage des themes de ce script' 'Cyan'
        $all = Invoke-Api -Root $BaseUrl -Method GET -Path $ListPath -Token $token
        foreach ($theme in $all.Json.data | Where-Object { ($Names + $Renamed) -contains $_.name }) {
            $del = Invoke-Api -Root $BaseUrl -Method DELETE -Path "/api/v1/themes/$($theme.id)" -Token $token
            Check "DELETE $($theme.name) -> 204" ($del.Status -eq 204) "statut $($del.Status)"
        }
        return
    }

    Log ''
    Log '== Creation des themes absents' 'Cyan'
    $before = Invoke-Api -Root $BaseUrl -Method GET -Path $ListPath -Token $token
    $present = @($before.Json.data | ForEach-Object { $_.name })
    foreach ($name in $Names) {
        $alreadyThere = ($present -contains $name) -or ($name -eq 'Musique' -and $present -contains $Renamed)
        if ($alreadyThere) { Log "[SKIP] $name : deja present"; continue }
        $created = Invoke-Api -Root $BaseUrl -Method POST -Path '/api/v1/themes' `
            -Body (@{ name = $name } | ConvertTo-Json -Compress) -Token $token
        Check "POST $name -> 201" ($created.Status -eq 201) "statut $($created.Status)"
    }

    Log ''
    Log "== Renommage de Musique en $Renamed" 'Cyan'
    $musique = (Invoke-Api -Root $BaseUrl -Method GET -Path $ListPath -Token $token).Json.data | Where-Object { $_.name -eq 'Musique' }
    if ($musique) {
        $renameResult = Invoke-Api -Root $BaseUrl -Method PUT -Path "/api/v1/themes/$($musique.id)" `
            -Body (@{ name = $Renamed } | ConvertTo-Json -Compress) -Token $token
        Check 'PUT Musique -> 200' ($renameResult.Status -eq 200) "statut $($renameResult.Status)"
    }
    else { Log "[SKIP] Musique : deja renomme" }

    Log ''
    Log '== Liste cote hub' 'Cyan'
    $hub = Invoke-Api -Root $BaseUrl -Method GET -Path $ListPath -Token $token
    Check 'GET liste -> 200' ($hub.Status -eq 200) "statut $($hub.Status)"
    $hubNames = @($hub.Json.data | ForEach-Object { $_.name })
    Check 'les 4 themes attendus sont dans la liste' (@($Expected | Where-Object { $hubNames -contains $_ }).Count -eq 4) ($hubNames -join ', ')
    Check 'total = nombre de themes renvoyes (moins de 100)' ($hub.Json.total -eq $hubNames.Count) "total $($hub.Json.total), renvoyes $($hubNames.Count)"
    $withoutCreated = @($hub.Json.data | Where-Object { -not $_.created_at })
    Check 'chaque theme a une date de creation' ($withoutCreated.Count -eq 0) "$($withoutCreated.Count) sans created_at"
    $renamedTheme = $hub.Json.data | Where-Object { $_.name -eq $Renamed }
    Check "$Renamed a une date de modification" ($renamedTheme -and $renamedTheme.last_updated_at) 'last_updated_at vide'
    $untouched = @($hub.Json.data | Where-Object { $Expected -contains $_.name -and $_.name -ne $Renamed })
    Check 'les 3 autres themes n ont pas de date de modification' (@($untouched | Where-Object { $null -ne $_.last_updated_at }).Count -eq 0) 'un theme non renomme a une date de modification'

    Log ''
    Log "== Liste a travers le proxy d'Angular ($AngularUrl)" 'Cyan'
    try {
        $proxied = Invoke-Api -Root $AngularUrl -Method GET -Path $ListPath -Token $token
        Check 'proxy /api -> hub : meme total' ($proxied.Json.total -eq $hub.Json.total) "total $($proxied.Json.total)"
    }
    catch {
        Log "[SKIP] npm start ne tourne pas sur $AngularUrl : lance-le (voir ci-dessous) puis relance ce script." 'Yellow'
    }

    Log ''
    Log '== A verifier dans le navigateur' 'Cyan'
    Log "Ouvre $AngularUrl/themes (hub et npm start lances)."
    Log "  1. Titre : Themes (avec l'accent grave sur le e)"
    Log "  2. Pastille a cote du titre : '$($hub.Json.total) au total'"
    Log "  3. $($hubNames.Count) cartes, dans cet ordre (le hub trie par date de creation decroissante) :"
    foreach ($theme in $hub.Json.data) {
        $line = "       - $($theme.name) : 'Cree le $(Format-Day $theme.created_at)'"
        if ($theme.last_updated_at) { $line += " et 'Modifie le $(Format-Day $theme.last_updated_at)'" }
        else { $line += ' et AUCUNE ligne Modifie le' }
        Log $line
    }
    Log "  4. Chaque carte : une icone de dossier violette a gauche, le nom puis la ou les dates dessous, accents lisibles (Cree, Modifie : e accent aigu)"
    Log '  5. Onglet Network : une seule requete GET /api/v1/themes?page=1&limit=100, statut 200'
    Log "  6. Va sur $AngularUrl/ : tu arrives toujours sur le tableau de bord (rien n'a change)"
}
finally {
    Log ''
    Log "Echecs : $script:Fail" $(if ($script:Fail -eq 0) { 'Green' } else { 'Red' })
    Save-Report
}
if ($script:Fail -gt 0) { exit 1 }
