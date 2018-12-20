@ECHO OFF

pushd %~dp0

REM docker build setup

set DOCKER=docker
set BUILDERNAME=zenko-docs
set BUILDERIMAGE=..\
set BUILDERDOCKERFILE=.\Dockerfile
set BUILDERHOME=/usr/src/zenko


REM Command file for Sphinx documentation

if "%SPHINXBUILD%" == "" (
	set SPHINXBUILD=sphinx-build
)
set SOURCEDIR=.
set BUILDDIR=_build
set SPHINXPROJ=Zenko

if "%1" == "" goto help

REM %SPHINXBUILD% >NUL 2>NUL
REM if errorlevel 9009 (
REM 	echo.
REM 	echo.The 'sphinx-build' command was not found. Make sure you have Sphinx
REM 	echo.installed, then set the SPHINXBUILD environment variable to point
REM 	echo.to the full path of the 'sphinx-build' executable. Alternatively you
REM 	echo.may add the Sphinx directory to PATH.
REM 	echo.
REM 	echo.If you don't have Sphinx installed, grab it from
REM 	echo.http://sphinx-doc.org/
REM 	exit /b 1
REM )

%SPHINXBUILD% -M %1 %SOURCEDIR% %BUILDDIR% %SPHINXOPTS%
goto end

:help
%SPHINXBUILD% -M help %SOURCEDIR% %BUILDDIR% %SPHINXOPTS%

:shell
	%DOCKER% build -t %BUILDERNAME%:latest -f %BUILDERDOCKERFILE% %BUILDERIMAGE%
	%DOCKER% run -it --rm -v %~dp0\..:%BUILDERHOME% --entrypoint=bash %BUILDERNAME%

:end
popd
