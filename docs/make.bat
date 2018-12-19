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

REM create a docker container work environment
:shell
	%DOCKER% build -t %BUILDERNAME%:latest -f %BUILDERDOCKERFILE% %BUILDERIMAGE%
	%DOCKER% run -it --rm -v "%~dp0\..:%BUILDERHOME%" -v "C:\:/c"--entrypoint=bash %BUILDERNAME%

:help
	%SPHINXBUILD% -M help %SOURCEDIR% %BUILDDIR% %SPHINXOPTS%

%SPHINXBUILD% -M %1 %SOURCEDIR% %BUILDDIR% %SPHINXOPTS%
goto end


:end
popd
