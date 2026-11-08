<#
.SYNOPSIS
    Smoke test de la liste des themes (/themes) contre un vrai hub.
.DESCRIPTION
    1. Se connecte au hub et cree 3 themes (deja presents = tolere).
    2. Lit la liste cote hub (GET /api/v1/themes?page=1&limit=100) et verifie total et noms.
    3. Si `npm start` tourne, relit la meme liste a travers le proxy d'Angular (/api -> hub).
    4. Affiche ce qu'il faut voir dans le navigateur sur /themes.
    Avec -Cleanup : supprime les 3 themes crees par ce script, puis s'arrete.
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

$Names = @("G$([char]0xE9)ographie", 'Histoire', "Cin$([char]0xE9)ma")
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
        Log '== Nettoyage des themes de ce script' 'Cyan'
        $all = Invoke-Api -Root $BaseUrl -Method GET -Path $ListPath -Token $token
        foreach ($theme in $all.Json.data | Where-Object { $Names -contains $_.name }) {
            $del = Invoke-Api -Root $BaseUrl -Method DELETE -Path "/api/v1/themes/$($theme.id)" -Token $token
            Check "DELETE $($theme.name) -> 204" ($del.Status -eq 204) "statut $($del.Status)"
        }
        return
    }

    Log ''
    Log '== Creation des themes' 'Cyan'
    foreach ($name in $Names) {
        $created = Invoke-Api -Root $BaseUrl -Method POST -Path '/api/v1/themes' `
            -Body (@{ name = $name } | ConvertTo-Json -Compress) -Token $token
        Check "POST $name -> 201 ou 409 (deja present)" (@(201, 409) -contains $created.Status) "statut $($created.Status)"
    }

    Log ''
    Log '== Liste cote hub' 'Cyan'
    $hub = Invoke-Api -Root $BaseUrl -Method GET -Path $ListPath -Token $token
    Check 'GET liste -> 200' ($hub.Status -eq 200) "statut $($hub.Status)"
    $hubNames = @($hub.Json.data | ForEach-Object { $_.name })
    Check 'les 3 themes sont dans la liste' (@($Names | Where-Object { $hubNames -contains $_ }).Count -eq 3) ($hubNames -join ', ')
    Check 'total = nombre de themes renvoyes (moins de 100)' ($hub.Json.total -eq $hubNames.Count) "total $($hub.Json.total), renvoyes $($hubNames.Count)"

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
    foreach ($n in $hubNames) { Log "       - $n" }
    Log '  4. Chaque carte : une icone de dossier violette a gauche, le nom a droite, accents lisibles'
    Log '  5. Onglet Network : une seule requete GET /api/v1/themes?page=1&limit=100, statut 200'
    Log "  6. Va sur $AngularUrl/ : tu arrives toujours sur le tableau de bord (rien n'a change)"
}
finally {
    Log ''
    Log "Echecs : $script:Fail" $(if ($script:Fail -eq 0) { 'Green' } else { 'Red' })
    Save-Report
}
if ($script:Fail -gt 0) { exit 1 }
