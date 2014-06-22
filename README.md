# ImgUri

Easily convert local/network image file to data uri scheme.

## Installation

    $ npm install --save imguri

## Usage

    var imguri = require('imguri');

    // ..

    var resources = [
        'test/test.png',
        'test/nofile',
        'http://www.vnykmshr.com/images/favicon.ico',
        'http://www.vnykmshr.com/images/whois.png',
        'http://www.vnykmshr.com/'
    ];

    var options = {
        force: false
    };

    imguri.encode(resources, options, console.log);

    // ..
    {
        'test/nofile': {
            err: [Error: no such file: test/nofile],
            data: undefined
        },

        'test/test.png': {
            err: null,
            data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QIKFAE7xDbFnAAAArZJREFUOMuVlFtIVFEUhr99zpw5c86ZySYtp/E2ZhTdSekCBVIUUUIvURChJkFERdFD7z0HEfQURNmFqKhewojexIeKpILK7pZZSBcRnUnHc+bM3j14Chu16H9asNa/1r/3v/aGidCBEJNDBDltMlIhDgFHgZ6AWAWUAhawCTgGDAHv+AdOAgrwgFwQq3GxCzQVkgqPEAkmAxh/qU38S81qoBtQ0YghZ0RtZYUNZYcNVRyzlWOGZKDqATD/b4pKgdSO+jpadm0XhpvBHRkZk2pbZMMxcbr1Mm0PnlcGql5P1cirmBl3DzRus8qykuSyOix9rJGHw8eHXexv3E7nqx7/6+CPXKGiIsAOHDScSLjPipg1btpVXh4R9l2EEHi6w6iPisZtYZvhQSAGlAN5wNWDC84DaeBFf3rYrJzurG/YWq9FjRy5wQzKl1iOTjyVENdv3eFGx+NTwMXAQQFIMV5dzYrltbMqk6P3b96Ob6xbuG9eRWLDNMss1jTBaC4/2Putv/16+6NzQNuUdp1VKrRs7+FN1bVLTtRuXreSsFUEPA32xwOeBdOnxu5e9Tt2ZsSbSuemOuLJxAuhiSfA+8CdDmAt/4lyoBm4AbwBuoBrwIpfBS19iqNdcuIetXxWtJYLjnhKjxmUXG3cU5Pu+bAo/b67RAvpMlpVrUeTyZ1br16yM5/UwzNJkW3+LP94zb/R1KtsI8RBzWDf27Z75ZnebsMwXTQ9RDYjKJozNz+vYc2XvMcV3+f4hSrxfdKFzGfxjRizla+qE3WrMEuXoocNBIJo1qW42talr8oQIiWkkoX/yx/Y0ydjms7qH/1iy/AAi70RahVETIfOWAkvrSJ1Vyo65BAD5xdoExvt7pGcT40l9n6TYugr2uiQ0NxhpSkEpqNktBhpTUeena0pgJaPktaqMc5PvVXwjWslTpwAAAAASUVORK5CYII='
        },

        'http://www.vnykmshr.com/images/whois.png': {
            err: [Error: Size limit exceeded: 11202 > 4096 Set options.force to override],
            data: undefined
        },

        'http://www.vnykmshr.com/': {
            err: [Error: Not an image, content - type: text / html, link: http: //www.vnykmshr.com/],
            data: undefined
        },

        'http://www.vnykmshr.com/images/favicon.ico': {
            err: null,
            data: 'data:binary;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+/v7///////////////////////7+/v////////////7+/v/+/v7///////////////////////7+/v/+/v7//////8PDw//09PT/5+fn//7+/v//////8PDw/+jo6P///////////+jo6P/t7e3/0dHR/+jo6P///////////9/f3/9PT0//jIyM/wAAAP/w8PD//////0xMTP8AAAD///////////8AAAD/LCws/7Gxsf9VVVX///////////9kZGT/qamp/5OTk/8AAAD/8vLy//////9VVVX/AAAA////////////AAAA/zc3N///////FRUV//r6+v/4+Pj/GBgY//////+Tk5P/AAAA//Ly8v//////VVVV/wAAAP///////////wAAAP83Nzf//////09PT//c3Nz/1tbW/15eXv//////k5OT/wAAAP/w8PD//////1ZWVv8AAAD///////////8AAAD/NjY2//////+wsLD/rq6u/5qamv/Hx8f//////5OTk/8AAAD/gYGB//////8iIiL/AAAA/729vf/k5OT/AAAA/zw8PP//////5+fn/2pqav9RUVH/8PDw//////+Pj4//AAAA/ysrK/8AAAD/AAAA/0FBQf8HBwf/AAAA/wAAAP+4uLj///////f39/89PT3/Pj4+//7+/v//////9/f3/+3t7f/6+vr/w8PD/8HBwf/7+/v/7u7u/6ysrP/i4uL//v7+////////////VlZW/5CQkP///////v7+/////////////////////////////v7+//////////////////7+/v///////////6mpqf/z8/P////////////////////////////////////////////////////////////////////////////4+Pj///////7+/v/////////////////////////////////////////////////////////////////+/v7/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
        }
    }

The `encode` api returns a map of file being encoded to its result. If the specified input file is larger than `4KB`, it sets an `err`, you can set `options.force` to true to encode larger files. It is generally not a good idea to encode larger image files to data-uri as it increased the page load time.

You can use `result[file].data` as source to `img` tag on html pages to load images.

## Example

Please refer to [test/index.js](https://github.com/vnykmshr/imguri/blob/master/test/index.js) for a sample working code example.
