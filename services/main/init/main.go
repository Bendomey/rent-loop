package main

import (
	"flag"
)

func main() {
	isInit := flag.String("init", "false", "")
	flag.Parse()

	Setup(*isInit == "true")
}
