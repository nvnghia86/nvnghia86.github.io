# Run locally after downloading quizzz-manifest.xml into the same folder.
# Registers this manifest for the current Windows user (no admin access needed).
$ErrorActionPreference = 'Stop'
$manifest = Join-Path $PSScriptRoot 'quizzz-manifest.xml'
if (!(Test-Path -LiteralPath $manifest)) { throw 'Download quizzz-manifest.xml into the same folder first.' }
[xml]$xml = Get-Content -LiteralPath $manifest -Raw -Encoding UTF8
$addinId = [string]$xml.OfficeApp.Id
if ($addinId -ne 'b613fe44-4b37-421a-a39e-cd8597aeaa71') { throw 'Unexpected add-in ID.' }
$developerKey = 'HKCU:\Software\Microsoft\Office\16.0\WEF\Developer'
New-Item -Path $developerKey -Force | Out-Null
New-ItemProperty -Path $developerKey -Name $addinId -Value ([System.IO.Path]::GetFullPath($manifest)) -PropertyType String -Force | Out-Null
Write-Output 'Quizzz registered. Keep the manifest at this location and restart PowerPoint.'
