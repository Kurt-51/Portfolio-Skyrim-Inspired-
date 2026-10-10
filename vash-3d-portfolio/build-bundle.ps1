# build-bundle.ps1
# Compiles all HTML, CSS, JavaScript, and assets into a single self-contained standalone HTML file
# and creates a downloadable ZIP archive.

$root = $PSScriptRoot
Set-Location $root

Write-Host "1. Reading source files..."
$indexHtml = Get-Content -Raw -Path "index.html" -Encoding UTF8
$styleCss  = Get-Content -Raw -Path "css\style.css" -Encoding UTF8
$audioJs   = Get-Content -Raw -Path "js\audio.js" -Encoding UTF8
$dataJs    = Get-Content -Raw -Path "js\data.js" -Encoding UTF8
$appJs     = Get-Content -Raw -Path "js\app.js" -Encoding UTF8

Write-Host "2. Converting images to base64 data URIs for self-contained bundle..."
$bgBytes = [System.IO.File]::ReadAllBytes("$root\assets\skyrim-bg.jpg")
$bgBase64 = [Convert]::ToBase64String($bgBytes)
$bgDataUri = "data:image/jpeg;base64,$bgBase64"

$posterBytes = [System.IO.File]::ReadAllBytes("$root\assets\leon-poster.jpg")
$posterBase64 = [Convert]::ToBase64String($posterBytes)
$posterDataUri = "data:image/jpeg;base64,$posterBase64"

if (Test-Path "$root\assets\neurocomm-prototype.jpg") {
    $neuroBytes = [System.IO.File]::ReadAllBytes("$root\assets\neurocomm-prototype.jpg")
    $neuroBase64 = [Convert]::ToBase64String($neuroBytes)
    $neuroDataUri = "data:image/jpeg;base64,$neuroBase64"
    $dataJs = $dataJs.Replace('assets/neurocomm-prototype.jpg', $neuroDataUri)
}

if (Test-Path "$root\assets\community-vax.jpg") {
    $vaxBytes = [System.IO.File]::ReadAllBytes("$root\assets\community-vax.jpg")
    $vaxBase64 = [Convert]::ToBase64String($vaxBytes)
    $vaxDataUri = "data:image/jpeg;base64,$vaxBase64"
    $dataJs = $dataJs.Replace('assets/community-vax.jpg', $vaxDataUri)
}

if (Test-Path "$root\assets\nebula-sync.jpg") {
    $nebulaBytes = [System.IO.File]::ReadAllBytes("$root\assets\nebula-sync.jpg")
    $nebulaBase64 = [Convert]::ToBase64String($nebulaBytes)
    $nebulaDataUri = "data:image/jpeg;base64,$nebulaBase64"
    $dataJs = $dataJs.Replace('assets/nebula-sync.jpg', $nebulaDataUri)
}

# Replace relative image URLs with embedded base64
$styleCss = $styleCss.Replace("url('../assets/skyrim-bg.jpg')", "url('$bgDataUri')")
$styleCss = $styleCss.Replace('url("../assets/skyrim-bg.jpg")', "url('$bgDataUri')")
$indexHtml = $indexHtml.Replace('src="assets/leon-poster.jpg"', "src='$posterDataUri'")

Write-Host "3. Merging JavaScript modules into clean standalone code..."
# Clean audio.js: change export const to const
$audioClean = $audioJs -replace 'export const sound =', 'const sound ='
$audioClean = $audioClean -replace 'export const SKYRIM_SHOUTS =', 'const SKYRIM_SHOUTS ='

# Clean data.js: change export const PORTFOLIO_DATA to const PORTFOLIO_DATA
$dataClean = $dataJs -replace 'export const PORTFOLIO_DATA =', 'const PORTFOLIO_DATA ='

# Clean app.js: remove imports
$appClean = $appJs -replace 'import\s+.*?;\r?\n', ''
# Guard SceneManager reference if still present
$appClean = $appClean -replace 'this\.sceneManager = new SceneManager\(container\);', 'if (typeof SceneManager !== "undefined") { this.sceneManager = new SceneManager(container); }'

$combinedJs = @"
// ==========================================
// 1. PROCEDURAL SOUND SYNTHESIZER
// ==========================================
$audioClean

// ==========================================
// 2. PORTFOLIO DATA ARCHITECTURE
// ==========================================
$dataClean

// ==========================================
// 3. MAIN APPLICATION & GUNSLINGER ENGINE
// ==========================================
$appClean
"@

Write-Host "4. Assembling standalone HTML document..."
# Replace CSS link with inline style tag
$bundleHtml = $indexHtml -replace '<link rel="stylesheet" href="css/style\.css">', "<style>`n$styleCss`n</style>"

# Replace script tag with inline script
$bundleHtml = $bundleHtml -replace '<script type="module" src="js/app\.js"></script>', "<script>`n$combinedJs`n</script>"

# Output standalone file
$outHtmlPath = "$root\leon-escaner-portfolio.html"
[System.IO.File]::WriteAllText($outHtmlPath, $bundleHtml, [System.Text.Encoding]::UTF8)
Write-Host "Created standalone HTML at: $outHtmlPath"

Write-Host "5. Creating downloadable ZIP archive..."
$zipPath = "$root\leon-escaner-portfolio.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

# Create a temporary staging directory for the zip package
$stageDir = "$root\staging_zip"
if (Test-Path $stageDir) { Remove-Item $stageDir -Recurse -Force }
New-Item -ItemType Directory -Path $stageDir | Out-Null

# Copy standalone file and modular source
Copy-Item "$outHtmlPath" -Destination "$stageDir\index.html"
Copy-Item "$outHtmlPath" -Destination "$stageDir\leon-escaner-portfolio.html"
Copy-Item "$root\README.md" -Destination "$stageDir\" -ErrorAction SilentlyContinue

# Also include assets and modular code for editing flexibility
Copy-Item -Path "$root\css" -Destination "$stageDir\css" -Recurse
Copy-Item -Path "$root\js" -Destination "$stageDir\js" -Recurse
Copy-Item -Path "$root\assets" -Destination "$stageDir\assets" -Recurse
Copy-Item -Path "$root\serve.ps1" -Destination "$stageDir\serve.ps1"

Compress-Archive -Path "$stageDir\*" -DestinationPath $zipPath -Force
Remove-Item $stageDir -Recurse -Force

Write-Host "Successfully compiled portfolio bundle!"
Write-Host "Standalone HTML: $outHtmlPath"
Write-Host "Downloadable ZIP: $zipPath"
