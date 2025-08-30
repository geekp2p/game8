package main

import "embed"

//go:embed web/game8/*
var EmbeddedFS embed.FS
