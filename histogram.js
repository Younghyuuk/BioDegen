class Histogram {
    constructor(x, y, data, options) {
        this.x = x;
        this.y = y;
        this.data = data;

        const defaults = {
            label: "",
            width: PARAMETERS.graphWidth,
            height: PARAMETERS.graphHeight,
        };
        Object.assign(this, defaults, options);

        this.ctx = gameEngine.ctx;
        this.maxVal = 0;
    }
    update() {
    }
    draw(ctx) {
        // if (!document.getElementById("graphs").checked) return;
        var length = this.data.length > (this.width) ?
            Math.floor(this.width) : this.data.length;
        var start = this.data.length > (this.width) ?
            this.data.length - (this.width) : 0;
        for (var i = 0; i < length; i++) {
            var maxVal = this.data[i + start].reduce(function (acc, x) {
                return acc + x;
            }, 0);
            for (var j = 0; j < this.data[i + start].length; j++) {

                this.fill(this.data[i + start][j] / maxVal, i, 19 - j);
            }
        }
        this.ctx.fillStyle = "#000000";
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height + 10);

        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    fill(color, x, y) {
        this.ctx.fillStyle = "white";
        var c = color * 99 + 1;
        c = 511 - Math.floor(Math.log(c) / Math.log(100) * 512);
        if (c > 255) {
            c = c - 256;
            this.ctx.fillStyle = rgb(c, c, 255);
        }
        else {
            //c = 255 - c;
            this.ctx.fillStyle = rgb(0, 0, c);
        }

        var width = 1;
        var height = Math.floor(this.height / 20);
        this.ctx.fillRect(this.x + (x * width),
            this.y + (y * height),
            width,
            height);
    }
};



