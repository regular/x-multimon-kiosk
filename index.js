// jshint esversion: 6
const {spawn} = require('child_process');
const pull = require('pull-stream');
const toPull = require('stream-to-pull-stream');
const split = require('pull-split');
const fs = require('fs');

// ask xrandr for the connected displays
// and create ~/.config/compiz-1/compizconfig/Default.ini

const defulats = {
    compizConfigPath: `${process.env.HOME}/.config/compiz-1/compizconfig/Default.ini`,
    sortFunc: (a, b)=> a == b ? 0 : (a > b ? 1 : -1),
    xrandrPath: `/usr/bin/xrandr`,
    compizrPath: `/usr/bin/compiz`,
    spawn: spawn,   // used by tests
    writeFileSync: fs.writeFileSync, // used by tests
    compizConfigTemplate: compizTemplate
};

module.exports = function(opts, cb) {
    if (typeof opts === 'function') {
        cb = opts;
        opts = {};
    }
    opts = Object.assign({}, defulats, opts);
    pull(
        xrandr(),
	    pull.collect( (err, screens) => {
			if (err) return cb(err);
            if (!screens.length) return cb(new Error('No monitors detected'));
			let xres = screens.reduce( (acc, screen) => acc + screen.xres, 0);
			let yres = screens[0].yres;
            if (opts.compizConfigPath) {
                let content = compizTemplate({xres,yres});
                try {
                    opts.writeFileSync(opts.compizConfigPath, content);
                } catch(e) {
                    return cb(e);
                }
            }
			cb(null, screens);
	    })
	);

    function xrandr() {
        let xrandr = opts.spawn(opts.xrandrPath);
        if (!xrandr) return pull.error(new Error('Unable to spawn xrandr'));
        return pull(
            toPull(xrandr.stdout),
            pull.map( x=> x.toString() ),
            split(),
            pull.map( l => l.match(/^(.*)\sconnected(?:\sprimary){0,1}\s(\d+)x(\d+)([\+\-]\d+)([\+\-]\d+)/) ),
            pull.filter(),
            pull.map( ([_,name,xres,yres,left,top]) => {
                return {
                    name,
                    xres: Number(xres),
                    yres: Number(yres),
                    left: Number(left),
                    top: Number(top)
                }; 
            })
        );
    }
};

function compizTemplate({xres, yres}) {
	return `
[core]
s0_detect_outputs = false
s0_outputs = ${xres}x${yres}+0+0;

[place]
s0_multioutput_mode = 3
`;
}

