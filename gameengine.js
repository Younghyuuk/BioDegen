// This game shell was happily modified from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

class GameEngine {
    constructor(options) {
        // What you will use to draw
        // Documentation: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
        this.ctx = null;

        // Everything that will be updated and drawn each frame
        this.entities = [];

        // Information on the input
        this.click = null;
        this.clickCoords = { x: 0, y: 0 };;
        this.mouse = null;
        this.wheel = null;
        this.keys = {};

        // Options and the Details
        this.options = options || {
            debugging: false,
        };
    };

    init(ctx) {
        this.ctx = ctx;
        this.startInput();
        this.timer = new Timer();
        this.fps = 0;
    };

    start() {
        this.running = true;
        const gameLoop = () => {
            this.loop();
            requestAnimFrame(gameLoop, this.ctx.canvas);
        };
        gameLoop();
    };

    startInput() {
        const getXandY = e => ({
            x: e.clientX - this.ctx.canvas.getBoundingClientRect().left,
            y: e.clientY - this.ctx.canvas.getBoundingClientRect().top
        });
        
        this.ctx.canvas.addEventListener("mousemove", e => {
            if (this.options.debugging) {
                console.log("MOUSE_MOVE", getXandY(e));
            }
            this.mouse = getXandY(e);
        });

        this.ctx.canvas.addEventListener("click", e => {
            this.click = getXandY(e);
            this.clickCoords = this.click;
            if (this.options.debugging) {
                console.log("CLICK", clickCoords);
            }
        });

        this.ctx.canvas.addEventListener("wheel", e => {
            if (this.options.debugging) {
                console.log("WHEEL", getXandY(e), e.wheelDelta);
            }
            e.preventDefault(); // Prevent Scrolling
            this.wheel = e;
        });

        this.ctx.canvas.addEventListener("contextmenu", e => {
            if (this.options.debugging) {
                console.log("RIGHT_CLICK", getXandY(e));
            }
            e.preventDefault(); // Prevent Context Menu
            this.rightclick = getXandY(e);
        });

        this.ctx.canvas.addEventListener("keydown", event => this.keys[event.key] = true);
        this.ctx.canvas.addEventListener("keyup", event => this.keys[event.key] = false);
    };



    addEntity(entity) {
        this.entities.push(entity);
    };

    draw() {
        // Clear the whole canvas with transparent color (rgba(0, 0, 0, 0))
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Draw latest things first
        for (let i = this.entities.length - 1; i >= 0; i--) {
            this.entities[i].draw(this.ctx, this);
        }

        this.drawFps();
    };

    drawFps() {
        this.fps = this.timer.calculateFPS();
        this.ctx.fillStyle = "black";
        this.ctx.fillText(`FPS: ${this.fps.toFixed(2)}`, 1100, 600);
    }

    // update() {
    //     let entitiesCount = this.entities.length;

    //     for (let i = 0; i < entitiesCount; i++) {
    //         let entity = this.entities[i];

    //         if (!entity.removeFromWorld) {
    //             entity.update();
    //         }
    //     }

    //     for (let i = this.entities.length - 1; i >= 0; --i) {
    //         if (this.entities[i].removeFromWorld) {
    //             this.entities.splice(i, 1);
    //         }
    //     }
    // };


    //  experimental
    update() {
        let entitiesCount = this.entities.length;
    
        for (let i = 0; i < entitiesCount; i++) {
            let entity = this.entities[i];
    
            if (entity && !entity.removeFromWorld) {
                entity.update();
            }
        }
    
        for (let i = this.entities.length - 1; i >= 0; --i) {
            if (this.entities[i] && this.entities[i].removeFromWorld) {
                this.entities.splice(i, 1);
            }
        }
    };
    


    loop() {
        this.clockTick = this.timer.tick();
       
       
        this.update();
        this.draw();
       
    };

};

// KV Le was here :)