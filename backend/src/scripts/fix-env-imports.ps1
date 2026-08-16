<#
.SYNOPSIS
    Replaces direct dotenv/config imports in backend scripts
    with the centralized environment configuration module.

.DESCRIPTION
    This script updates the backend scripts that currently contain:

        import "dotenv/config";

    and replaces it with:

        import "../../../config/env";

    This keeps environment loading centralized.

    After the change:

    - development uses .env
    - tests use .env.test
    - production can use server environment variables or .env as fallback
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
```
<#
.SYNOPSIS
    Replaces direct dotenv/config imports in backend scripts
    with the centralized environment configuration module.

.DESCRIPTION
    This script updates the backend scripts that currently contain:

        import "dotenv/config";

    and replaces it with:

        import "../../../config/env";

    This keeps environment loading centralized.

    After the change:

    - development uses .env
    - tests use .env.test
    - production can use server environment variables or .env as fallback
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
