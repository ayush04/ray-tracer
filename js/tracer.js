(function(document) {
    var dx = 0.001; //
    var startX = 10; // x-coordinate of top left corner of mirror
    var startY = 50; // y-coordinate of top left corner of mirror 

    var scene = {};

    /**
     * initial dimenstions of the parallel surfaces
     */
    var dimensions = {
        length: 400,
        thickness: 100
    };


    /**
     * Utility method to get tan value 
     * @param {scene.raySource.angle} x - angle in degrees
     */
    function tan(x) {
        return Math.tan(x * Math.PI / 180);
    }

    /**
     * Global canvas object. Contains a scene object which holds all the elements viz. mirrors, ray source and ray
     * @param {object} scene - Scene object
     * @param {object} dimensions - Scene dimension
     */
    var Canvas = function(scene, dimensions) {
        this.scene = scene;
        this.dimensions = dimensions;
        this.ctx = null; // canvas context

        /**
         * Definition of a point
         * @param {Number} x  - x co-ordinate
         * @param {Number} y - y co-ordinate
         */
        var point = function(x, y) {
            return {
                x: x,
                y: y
            }
        }

        /**
         * Definition of a line
         * @param {Canvas.point} p1 
         * @param {Canvas.point} p2 
         */
        var line = function(p1, p2) {
            return {
                p1: p1,
                p2: p2
            }
        }

        var setContext = function(ctx) {
            this.ctx = ctx;
        }

        /**
         * initialize a scene with default values
         * TODO: values used to be parameterized
         */
        var populateSceneObject = function() {
            // top mirror object
            this.scene.topMirror = {
                startPoint: point(startX, startY),
                endPoint: point(startX + this.dimensions.length, startY),
                color: 'red'
            };
            // bottom mirror object
            this.scene.bottomMirror = {
                startPoint: point(startX, startY + this.dimensions.thickness),
                endPoint: point(startX + this.dimensions.length, startY + this.dimensions.thickness),
                color: 'red'
            };
            // top mirror object
            this.scene.raySource = {
                // calculate the center between 2 mirrors
                point: point(startX, startY + (this.dimensions.thickness / 2)),
                color: 'black',
                angle: 60
            };

            this.scene.ray = {
                color: 'rgb(255,255,128)'
            };

            this.scene.firstIntersectionOnTopMirror = true;
        }

        var clearScene = function() {
            this.scene = {};
        }

        /**
         * Reset the variables and repaint the entire canvas
         */
        var repaint = function() {
            ctx.clearRect(0, 0, this.width, this.height);
            ctx.restore();
            // call to Process 1
            this.scene.raySource.angle = computeAngle(this.scene.raySource.angle);
            // if the angle is > 0, then the first intersection of the ray will be with top mirror
            this.scene.firstIntersectionOnTopMirror = (this.scene.raySource.angle > 0);
            createInitialScene.call(this);
            startRaySource.call(this);
            updateDashBoard();
        }

        /**
         * Draws a line between points p1 & p2 with color "color"
         * @param {Canvas.point} p1 
         * @param {Canvas.point} p2 
         * @param {String} color 
         * @param {Array} lineDash - An array containing the line dash pattern
         */
        var drawLine = function(p1, p2, color, lineDash) {
            this.ctx.beginPath();
            if (lineDash && Array.isArray(lineDash)) {
                this.ctx.setLineDash(lineDash);
            } else {
                this.ctx.setLineDash([]);
            }
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.strokeStyle = color ? color : 'white';
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
        }

        /**
         * Creates the initial scene with the mirrors in ray source
         */
        var createInitialScene = function() {
            // create mirrors
            drawLine(this.scene.topMirror.startPoint, this.scene.topMirror.endPoint, this.scene.topMirror.color);
            drawLine(this.scene.bottomMirror.startPoint, this.scene.bottomMirror.endPoint, this.scene.bottomMirror.color);
            // create source
            drawLine(this.scene.raySource.point, this.scene.raySource.point, this.scene.raySource.color);
            // create dotted vertical lines
            drawLine(this.scene.topMirror.startPoint, this.scene.bottomMirror.startPoint, 'white', [5, 7]);
            drawLine(this.scene.topMirror.endPoint, this.scene.bottomMirror.endPoint, 'white', [5, 7]);
        }

        /**
         * Finds the intersection point between 2 lines 
         * @param {Canvas.line} l1 
         * @param {Canvas.line} l2 
         */
        var getIntersectionPoint = function(l1, l2) {
            var A = l1.p2.x * l1.p1.y - l1.p1.x * l1.p2.y;
            var B = l2.p2.x * l2.p1.y - l2.p1.x * l2.p2.y;
            var xa = l1.p2.x - l1.p1.x;
            var xb = l2.p2.x - l2.p1.x;
            var ya = l1.p2.y - l1.p1.y;
            var yb = l2.p2.y - l2.p1.y;
            return point((A * xb - B * xa) / (xa * yb - xb * ya), (A * yb - B * ya) / (xa * yb - xb * ya));
        }

        /**
         * Sets ray stroke color and starts ray tracing
         */
        var startRaySource = function() {
            this.ctx.strokeStyle = this.scene.ray.color;
            traceRay.call(this, this.scene.raySource.point, this.scene.firstIntersectionOnTopMirror);
        }

        /**
         * Main method to compute ray path - Process 2
         * @param {Canvas.point} startPoint - Start point of the ray
         * @param {Boolean} intersectOnTopMirror - flag to indicate if the intersection is with top mirror
         */
        var traceRay = function(startPoint, intersectOnTopMirror) {
            // add a small value dx on x to get the second point
            var endPoint = point(startPoint.x + dx, startPoint.y - (intersectOnTopMirror ? 1 : -1) * dx * tan(Math.abs(this.scene.raySource.angle)));
            // create a line from start and end points
            var ray = line(startPoint, endPoint);
            var intersection;
            var mirror = intersectOnTopMirror ? this.scene.topMirror : this.scene.bottomMirror;
            // get the intersection between the two lines
            var intersection = getIntersectionPoint(ray, line(mirror.startPoint, mirror.endPoint));
            if (intersection) {
                // if intersection is found draw the line between the start point and the intersection
                drawLine(startPoint, intersection, 'white');
                // if the x-coordinate of intersection is within the range of mirror, recursively call calculateIntersection
                // method with intersection as startPoint
                if (intersection.x > mirror.startPoint.x && intersection.x <= mirror.endPoint.x) {
                    traceRay.call(this, intersection, !intersectOnTopMirror);
                }
            }
        }

        /**
         * Entry method to initialize the Canvas object
         * @param {String} canvasId - Canvas ID in DOM
         * @param {Number} canvasHeight
         * @param {Number} canvasWidth
         */
        Canvas.prototype.initialize = function(canvasId, canvasHeight, canvasWidth) {
            var canvas = document.getElementById(canvasId);
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            this.height = canvasHeight;
            this.width = canvasWidth;
            ctx = canvas.getContext('2d');
            setContext.call(this, ctx);
            populateSceneObject.call(this);
            createInitialScene.call(this);
            startRaySource.call(this);
        }

        var timer;
        Canvas.prototype.setTimerForCanvasRepaint = function(interval) {
            var fn = repaint;
            var _this = this;
            timer = window.setInterval(function() {
                fn.call(_this);
            }, interval);
        }

        Canvas.prototype.resetTimer = function() {
            window.clearInterval(timer);
        };

        Canvas.prototype.setDimensions = function(dimensions) {
            this.dimensions = dimensions;
        }

        Canvas.prototype.reset = function() {
            clearScene.call(this);
            populateSceneObject.call(this);
            createInitialScene.call(this);
            repaint.call(this);
        }
    }

    var incrementing;
    /**
     * Method to compute angle - Process 1
     * It checks if the angle value is increasing or decreasing and returns the next value
     * @param {Number} angle - Angle in degrees
     * @returns Next angle in degrees 
     */
    function computeAngle(angle) {
        if (angle >= 60) {
            incrementing = false;
        }
        if (angle <= -60) {
            incrementing = true;
        }
        incrementing ? angle++ : angle--;
        return angle;
    }


    var canvas = new Canvas(scene, dimensions);
    canvas.initialize('ray-viewer', 500, 800);
    canvas.setTimerForCanvasRepaint(1000);
    addEventListeners();

    /**
     * Method to update the dashboard
     */
    function updateDashBoard() {
        document.getElementById('length').innerHTML = dimensions.length;
        document.getElementById('thickness').innerHTML = dimensions.thickness;
        document.getElementById('angle').innerHTML = canvas.scene.raySource.angle;
    }

    /**
     * Method to add event listeners on for user actions
     */
    function addEventListeners() {
        registerListener('length-input', 'length');
        registerListener('thickness-input', 'thickness');
        document.getElementById('btn-play').addEventListener('click', function() {
            canvas.setTimerForCanvasRepaint(1000);
        });
        document.getElementById('btn-pause').addEventListener('click', function() {
            canvas.resetTimer();
        });
    }

    /**
     * Helper method for registering event listeners
     * @param {String} elementId - Element ID in DOM
     * @param {Canvas.dimensions.dimension} dimension - name of dimension getting updated.
     * Possible values - length or thickness
     */
    function registerListener(elementId, dimension) {
        document.getElementById(elementId).addEventListener('input', function(event) {
            if (event && event.target && event.target.value) {
                var val = parseFloat(event.target.value);
                if (val && val > 0) {
                    dimensions[dimension] = val;
                    canvas.setDimensions(dimensions);
                    canvas.reset();
                }
            }
        });
    };
})(document);