# The Problem

Building a Linux/X-based kiosk (POI/POS) system is tricky when multiple monitors are involved. This module is designed to be used by a NodeJS application that is started, for example, in a user's ~/.xprofile.

## Single output

All connected monitors are combined to create a single output that can be rendered to by a single instance of, say, chromium in kiosk mode, or any other full screen application. Normally, when entering full screen mode, an application's window only covers one of the monitors. Spanning all monitors is acomplished by using a feature of compiz.

## Consistent ordering

Different startup times between monitors might affect in which order they are detected by the graphics hardware. This can cause inconistencies between system startups. The image for the right monitor might end up on the left monitor and vice versa. This module uses `xrandr` to find out about the connected screens and to configure their positions in the combined output. You can provide a sort function for custom ordering based on your graphics card's connector names. (e.g. the monitor connected to 'Displayport-1' always should be to the left of'the monitor connected to 'Displayport-2'.)

## Screen resolution independence

Sometimes media installations use exotic hardware that might not be available to you as a developer. You must write software that works on your development machine as well as on the production system that uses different monitor dimensions and resolutions. Therefore it is not a good idea to hard-code screen resolutions into your code or even config files. This module finds out about the connected monitors' resolutions at start-up.


# Example usage

``` js
const xmmk = require('x-multimon-kiosk');

xmmk( (err, monitors)=> {
    // monitors is an array of objects
    // with these properties
    /* [
            {name: 'DP-1',  // connector name
             xres: 1920,    // width in pixels
             yres: 1080,    // height in pixels
             left: 0,       // x-position in combined output
             top: 0         // y-position in combined output
            },
            {name: 'DP-2',
             xres: 1920,
             yres: 1080,
             left: 1920,
             top: 0
            },
       ] */
});

```

# Dependencies

You need to use `compiz` as your window manager and you need the `xrandr` binary.

# API

## xmmk([options], cb)

Options are:

- `sortFunc` a function used to sort monitors by connector name (see Array.sort). Defaults to alphanumerical order.
- `arrange` must be xmmk.HORIZONTAL (VERTICAL is not implemented yet). Defines whether monitors are arranged next to each other or below each other.
- `xrandrPath` - path to xrandr binary (defaults to `/usr/bin/xrandr`)
- `compizConfigPath` - path to config file (it ill be overwritten!, defaults to `${process.env.HOME}/.config/compiz-1/compizconfig/Default.ini`)
- `compizConfigTemplate` - a function that creates the contents of the config file. It is called with one argument, which is an object containing properties `xres` and `yres`. Defaults to:

``` js
function compizTemplate({xres, yres}) {
	return `
[core]
s0_detect_outputs = false
s0_outputs = ${xres}x${yres}+0+0;

[place]
s0_multioutput_mode = 3
`;
}
```

# How it works

This module runs `xrandr` to find out what screens are connected. It then uses a user-defined (or default) sort function to order the screens. It then runs `xrandr` again to set their position in the combined output. Finnaly it runs `xrandr` yet again, to get the final result, which is passed to the user-defined callback. Before that callback is called, it creates a configuration for `compiz` to implement the combined output. You shuld run `compiz --replace` afterwards.

