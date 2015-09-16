# ldr-stepper [![Build Status](https://travis-ci.org/boneskull/ldr-stepper.svg?branch=master)](https://travis-ci.org/boneskull/ldr-stepper)

> Break an LDraw (LDR) file into steps 

This tool can help you create a base from which to work from when building instructions from an [LDraw](http://ldraw.org) `.ldr` file.  

It works by sorting on the coordinate of each piece (*x*, *y*, or *z*-axis), then inserts "steps" as you specify.  Using the default axis, *y*, will result in steps which start at the "bottom" of the model, continuing to the "top".  Likewise, you can change the dimension to *x* to start at the "top" and work your way down, or start at the "back" and work towards the "front" with the *z*-axis.

*Don't* expect the output of this tool to generate proper instructions for you.  It just gives you a starting point.

## Install

1.  Install [NodeJS](https://nodejs.org) v0.10 or greater.

2.  Install globally with `npm`:

  ```shell
  $ npm install -g ldr-stepper
  ```

## Usage

```plain
ldr-stepper [options] <file.ldr>

Options:
  --version     Show version number                                    [boolean]
  --output, -o  Output file; if unspecified, will output to STDOUT      [string]
  --pieces, -p  Number of pieces per step                          [default: 10]
  --steps, -s   Maximum number of steps.  Overrides --pieces
  --axis, -a    Axis on which to sort pieces
                                         [choices: "x", "y", "z"] [default: "y"]
  --force       Overwrite any file specified by --output        [default: false]
  --help, -h    Show help                                              [boolean]
```

## Notes

- This tool ignores any data in the `.ldr` file that isn't a subfile reference (doesn't begin with `1`).  See [the specification](http://www.ldraw.org/article/218) for details.  This means the output will lose any metadata.
- Using `--steps` is somewhat slower that not using `--steps`. 
- You can conceivably use this tool on a `.dat` or `.mpd` file, but I don't know why you'd want to.
- The tool outputs a file with Windows (`\r\n`) line endings, as per the specification.
- This module can also be used programmatically.  It exports a function, `generateSteps(filepath, opts)`.  For details, see the source.

## License

© 2015 [Christopher Hiller](https://boneskull.com).  Licensed MIT.
