// jshint esversion:6
const test = require('tape');
const xmmk = require('.');
const from = require('from2-string');

test('parses xrandr output correctly', t=>{
    let xrandrCalls = [];

    let x = (content, opts, cb)=>{
        xmmk(Object.assign({
            xrandrPath: 'myXrandr',
            compizConfigPath: null, // prevent call to writeFileSync
            spawn: (command, args) => {
                if (command === 'myXrandr') {
                    xrandrCalls.push(args);
                }
                t.equal(command, 'myXrandr', 'Should use specified command');
                return {
                    stdout: from(content)
                };
            },
            writeFileSync: ()=>{
                t.fail('writeFileSync should not be called!')               ;
            }
        }, opts), cb);
    };

    t.test('bogus xrandr output', t=> {
        x(`bla
    bla
    bla
    `   , {}, (err, screens) => {
            t.notEqual(err, null, err.message);
            t.end();
        });
    });

    t.test('valid xrandr output', t=>{

        x(`
name1 connected 1x1+0+0
name2 connected primary 2x2+1+1
name3 connected 333x444+555+666
name4 connected 444444x555555-66-77
    `   , {arrange: null}, (err, screens) => {
            t.notOk(err);
            t.deepEqual(screens, [
              { name: 'name1',
                xres: 1, 
                yres: 1, 
                left: 0, 
                top: 0 },
              { name: 'name2',
                xres: 2,
                yres: 2,
                left: 1,
                top: 1 },
              { name: 'name3',
                xres: 333,
                yres: 444,
                left: 555,
                top: 666 },
              { name: 'name4',
                xres: 444444,
                yres: 555555,
                left: -66,
                top: -77 }
            ]);
            t.end();
        });
    });

    t.test('default sort by name and horiz arrangement', t=>{
        xrandrCalls = [];
        x(`
b connected 1x1+0+10
a connected 1x1+1-20
d connected 1x1+2+30
c connected 1x1+3-40
    `   , {}, (err, screens) => {
            t.notOk(err);
            t.equal(xrandrCalls.length, 3, 'Should have invoked xrandr three times');
            t.notOk(xrandrCalls[0], '1st time with no arguments');
            t.notOk(xrandrCalls[2], '3rd time with no arguments');
            t.equal(xrandrCalls[1].join(' '), '--output a --pos 0x0 --output b --pos 1x0 --output c --pos 2x0 --output d --pos 3x0', '2nd wtih correct arguments for horiz arrangement');

            /*
            t.deepEqual(screens, [
                {name: 'a', left:0, top:0, xres:1, yres:1},
                {name: 'b', left:1, top:0, xres:1, yres:1},
                {name: 'c', left:2, top:0, xres:1, yres:1},
                {name: 'd', left:3, top:0, xres:1, yres:1},
            ]);
            */
            t.end();
        });
    });
});
