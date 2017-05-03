# Work in progress

## Dependencies

You need to use `compiz` as your window manager (will be started by this module automatically) and the `xrandr` binary.

# The Problem

Building a Linux/X-based kiosk (POI/POS) system is tricky when multiple monitors are involved. This module is designed to be used by a NodeJS application that is started, for example, in a user's ~/.xprofile.

## Single output

All connected monitors are combined to create a single output that can be rendered to by a single instance of, say, chromium in kiosk mode, or any other full screen application. Normally, when entering full screen mode, an application's window only covers one of the monitors. This is acomplished by using a feature of compiz.

## Consistent ordering

Different startup times between monitors might affect in which order they are detected by the graphics hardware. This can cause inconistencies between system startups. The image for the right monitor might end up on the left monitor and vice versa. This module uses `xrandr` to find out about the connected screens and to configure their positions in the combined output. You can provide a sort function for custom ordering based on your graphics card's connector names. (e.g. the monitor connected to 'Displayport-1' always should be to the left of'the monitor connected to 'Displayport-2'.)

## Screen resolution independence

Sometimes media installations use exotic hardware that might not be available to you as a developer. You must write software that works on your development machine as well as on the production system that uses different monitor dimensions and resolutions. Therefore it is not a good idea to hard-code screen resolutions into your code or even config files. This module finds out about the connected monitors' resolutions at start-up.

## Screen-saver, power-down, blank screens

This module also tries to inhibit any screensaver-like behavior that otherwise causes the screens to power-down after a timeout.

@ Example

``` js
const xmmk = require('x-multimon-kiosk');

xmmk( {}, (err, monitors)=> {
    // monitors is an array of objects
    // with montor properties
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

# API

## xmmk([options], cb)

Options are:
- `sortFunction` a function used to sort monitors by connector name (see Array.sort). Defaults to alphanumerical order.
- `flow` either xmmk.HORIZONTAL (default) or xmmk.VERTICAL. Defines whether monitors are arranged next to each other or below each other.
- `compizPath` - path to compiz binary (optional)
- `xrandrPath` - path to xrandr binary (optional)

# How it works

This module runs `xrandr` to find out what screens are connected. It then uses a user-defined (or default) sort function to order the screens. It then runs `xrandr` again, once per screen to set their position in the combined output. Then it runs `xrandr` once again, to cget the final result which is passed to the user-defined callback. Before that callback is called, it creates a configuration for `compiz` to implement the combined output. It then runs `compiz --replace`.

