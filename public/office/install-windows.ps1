# Install for the current Windows user. No administrator access is needed.
# The BAT wrapper embeds this same script, so either download works on its own.
$ErrorActionPreference = 'Stop'
try {
    $addinId = 'b613fe44-4b37-421a-a39e-cd8597aeaa71'
    $manifestUrl = 'https://nvnghia86.github.io/office/quizzz-manifest.xml'
    $sourceFolder = $PSScriptRoot
    if ($env:QUIZZZ_INSTALLER_FILE) { $sourceFolder = [System.IO.Path]::GetDirectoryName($env:QUIZZZ_INSTALLER_FILE) }
    if (!$env:LOCALAPPDATA) { throw 'LOCALAPPDATA is unavailable. Run as your normal Windows user.' }
    $installFolder = Join-Path $env:LOCALAPPDATA 'Quizzz\PowerPoint'
    $manifestPath = Join-Path $installFolder 'quizzz-manifest.xml'
    $localManifest = if ($sourceFolder) { Join-Path $sourceFolder 'quizzz-manifest.xml' } else { '' }
    $temporaryFile = $null
    try {
        if ($localManifest -and (Test-Path -LiteralPath $localManifest -PathType Leaf)) {
            Write-Host 'Using quizzz-manifest.xml beside the installer.'
            $content = [System.IO.File]::ReadAllText($localManifest, [System.Text.Encoding]::UTF8)
        } else {
            Write-Host 'Downloading the Quizzz manifest...'
            [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
            $temporaryFile = [System.IO.Path]::GetTempFileName()
            Invoke-WebRequest -UseBasicParsing -Uri $manifestUrl -OutFile $temporaryFile -TimeoutSec 30
            $content = [System.IO.File]::ReadAllText($temporaryFile, [System.Text.Encoding]::UTF8)
        }
        $settings = New-Object System.Xml.XmlReaderSettings
        $settings.DtdProcessing = [System.Xml.DtdProcessing]::Prohibit
        $settings.XmlResolver = $null
        $reader = [System.Xml.XmlReader]::Create((New-Object System.IO.StringReader $content), $settings)
        try { $xml = New-Object System.Xml.XmlDocument; $xml.Load($reader) } finally { $reader.Dispose() }
        $namespaces = New-Object System.Xml.XmlNamespaceManager $xml.NameTable
        $namespaces.AddNamespace('o', 'http://schemas.microsoft.com/office/appforoffice/1.1')
        $id = $xml.SelectSingleNode('/o:OfficeApp/o:Id', $namespaces)
        $source = $xml.SelectSingleNode('/o:OfficeApp/o:DefaultSettings/o:SourceLocation', $namespaces)
        if (!$id -or $id.InnerText -ne $addinId -or !$source -or $source.GetAttribute('DefaultValue') -ne 'https://nvnghia86.github.io/office/card-game.html') {
            throw 'Unexpected manifest. Download the installer and manifest from the official Quizzz setup page.'
        }
        foreach ($dimension in @('RequestedWidth', 'RequestedHeight')) {
            $size = $xml.SelectSingleNode(('/o:OfficeApp/o:DefaultSettings/o:' + $dimension), $namespaces)
            $number = 0
            if (!$size -or ![int]::TryParse($size.InnerText, [ref]$number) -or $number -lt 32 -or $number -gt 1000) {
                throw ($dimension + ' must be between 32 and 1000. Remove the old XML beside this installer, then retry to download the corrected manifest.')
            }
        }
        [System.IO.Directory]::CreateDirectory($installFolder) | Out-Null
        [System.IO.File]::WriteAllText($manifestPath, $content, (New-Object System.Text.UTF8Encoding($false)))
    } finally {
        if ($temporaryFile -and (Test-Path -LiteralPath $temporaryFile)) { Remove-Item -LiteralPath $temporaryFile -Force }
    }
    $developerKey = 'HKCU:\Software\Microsoft\Office\16.0\WEF\Developer'
    New-Item -Path $developerKey -Force | Out-Null
    New-ItemProperty -Path $developerKey -Name $addinId -Value $manifestPath -PropertyType String -Force | Out-Null
    $registered = (Get-ItemProperty -Path $developerKey -Name $addinId).$addinId
    if ($registered -ne $manifestPath) { throw 'Could not verify the add-in registration.' }
    Write-Host ''
    Write-Host 'QUIZZZ INSTALLATION COMPLETE' -ForegroundColor Green
    Write-Host ('Manifest: ' + $manifestPath)
    Write-Host 'Save your slides, fully close PowerPoint, then open it again.'
    Write-Host 'Open Insert > My Add-ins (Office Add-ins), then refresh and look for Quizzz.'
    Write-Host 'Developer Add-ins may appear as a section or menu on supported Office builds.'
    Write-Host 'Do not use File > Options > Add-ins > PowerPoint Add-ins (.ppa/.ppam).'
    Write-Host 'Registration does not guarantee that your Office build or policy allows web add-ins.'
    Write-Host 'Open an exported Quizzz PPTX and test Slide Show before teaching.'
    Write-Host 'You may delete the downloaded installer; keep the installed manifest folder.'
} catch {
    Write-Host ''
    Write-Host ('INSTALLATION FAILED: ' + $_.Exception.Message) -ForegroundColor Red
    Write-Host 'Check Internet access and run as your normal Windows user.'
    Write-Host 'If device policy blocks scripts or add-ins, contact your IT administrator.'
    Write-Host 'Instructions: https://nvnghia86.github.io/office/setup.html'
    exit 1
}
