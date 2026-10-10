$bytes = [System.IO.File]::ReadAllBytes('C:\Users\Leon Escaner\.gemini\antigravity-ide\conversations\f4101665-980f-424b-86dc-50cfd71242cd.db')
$str = [System.Text.Encoding]::UTF8.GetString($bytes)
$allMatches = [regex]::Matches($str, '<USER_REQUEST>([\s\S]*?)</USER_REQUEST>')

$out = @()
for ($i = 0; $i -lt $allMatches.Count; $i++) {
    $text = $allMatches[$i].Groups[1].Value.Trim()
    $out += "=== USER REQUEST $i ==="
    $out += $text
    $out += "--------------------------------------"
}
$out | Set-Content -Path "C:\Users\Leon Escaner\.gemini\antigravity-ide\scratch\vash-3d-portfolio\user_prompts.txt" -Encoding UTF8
Write-Host "Extracted $($allMatches.Count) requests to user_prompts.txt"
