<#
.SYNOPSIS
    Replaces direct dotenv/config imports with the centralized env config.
#>

$files = @(
    "src\services\scripts\experiences\add-experience.ts",
    "src\services\scripts\experiences\delete-experience.ts",
    "src\services\scripts\experiences\patch-experience.ts",
    "src\services\scripts\projects\delete-project.ts",
    "src\services\scripts\projects\migrate-categories-projects.ts",
    "src\services\scripts\projects\patch-project.ts"
)

$oldImport = 'import "dotenv/config";'
$newImport = 'import "../../../config/env";'

foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        Write-Warning "File not found: $file"
        continue
    }

    $content = Get-Content $file -Raw

    if ($content.Contains($oldImport)) {
        $content = $content.Replace($oldImport, $newImport)

        Set-Content `
            -Path $file `
            -Value $content `
            -Encoding UTF8

        Write-Host "Updated: $file"
    }
    else {
        Write-Host "No dotenv/config import found: $file"
    }
}

Write-Host ""
Write-Host "Environment import migration completed."
