@echo off
TITLE AmbuRoute - Git Push to GitHub
echo ===================================================
echo   Pushing AmbuRoute Updates to GitHub
echo   Repository: https://github.com/ankitmishraa0/Amburoute.git
echo ===================================================
echo.
git push origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ===================================================
    echo   SUCCESS! GitHub updated successfully!
    echo   Your cloud deployment (Vercel/Render) will now
    echo   automatically build and update the live site.
    echo ===================================================
) else (
    echo ===================================================
    echo   Push failed or required GitHub login authorization.
    echo ===================================================
)
echo.
pause
