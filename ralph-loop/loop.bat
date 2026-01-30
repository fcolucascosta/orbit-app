@echo off
setlocal enabledelayedexpansion

set MAX_LOOPS=20
set COUNTER_FILE=%~dp0loop-counter.txt

:: Inicializa contador se não existir
if not exist "%COUNTER_FILE%" (
    echo 0 > "%COUNTER_FILE%"
)

:: Lê contador atual
set /p CURRENT=<"%COUNTER_FILE%"

:: Verifica se atingiu o limite
if %CURRENT% GEQ %MAX_LOOPS% (
    echo.
    echo ========================================
    echo   LIMITE DE %MAX_LOOPS% LOOPS ATINGIDO!
    echo ========================================
    echo.
    echo Para resetar, delete loop-counter.txt
    echo ou execute: loop.bat reset
    echo.
    pause
    exit /b 0
)

:: Comando reset
if "%1"=="reset" (
    echo 0 > "%COUNTER_FILE%"
    echo Contador resetado para 0.
    exit /b 0
)

:: Incrementa contador
set /a NEXT=%CURRENT%+1
echo %NEXT% > "%COUNTER_FILE%"

:: Mostra status
echo.
echo ========================================
echo   RALPH LOOP - Orbit Habit Tracker
echo ========================================
echo.
echo   Loop atual: %NEXT% de %MAX_LOOPS%
echo   Restantes:  !MAX_LOOPS! - !NEXT! = %MAX_LOOPS%-%NEXT%
echo.
echo ========================================
echo.
echo Proximos passos:
echo   1. Abra current-task.md para ver a tarefa
echo   2. Implemente a tarefa
echo   3. Atualize changelog.md
echo   4. Execute este script novamente
echo.
echo ========================================
echo.

pause
