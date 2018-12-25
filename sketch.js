let boids = [];

function setup() {
    createCanvas(1200,800);
    for(let i = 0; i < 400; i++) {
        let boid = new Boid(random(width),random(height));
        boids.push(boid);
    }
}
function draw() {
    background(51);
    text(Math.round(frameRate()),10,20);
    qt = new QuadTree(new Rectangle(width/2,height/2,width,height),10);
    for(let boid of boids) {
        let point = new Point(boid.location.x,boid.location.y,boid);
        qt.insert(point);
    }
    for(let boid of boids) {
        boid.draw();
        boid.update(qt);
    }
}

class Boid{
    constructor(x,y) {
        this.location = createVector(x,y);
        this.acceleration = createVector(0,0);
        this.velocity = createVector(random(0,1),random(0,1));
        this.r = 12;
        this.maxspeed = 3;
        this.maxforce = 2;
    }

    cohesion(qt) {
        let neighbordistance = 50;
        let sum = createVector(0,0);
        let total = 0;
        let queried = qt.query(new Circle(this.location.x,this.location.y,neighbordistance));
        for(let q of queried) {
            let b = q.userData;
            sum.add(b.location);
            total++;
        }        
        if(total > 0) {
            sum.div(total);
            return this.seek(sum);
        }
        else{
            return createVector(0,0);
        }
    }

    separation(qt) {
        let desiredseparation = 25;
        let steer = createVector(0,0);
        let queried = qt.query(new Circle(this.location.x,this.location.y,desiredseparation));
        let total = 0;
        for(let q of queried) {
            let b = q.userData;
            let d = p5.Vector.dist(this.location,b.location);
            if((d > 0) && (d < desiredseparation)) {
                let diff = p5.Vector.sub(this.location,b.location);
                diff.normalize();
                diff.div(d);
                steer.add(diff);
                total++;
            }
        }
        if(total > 0) {
            steer.div(total);
        }
        if(steer.mag() > 0) {
            steer.normalize();
            steer.mult(this.maxspeed);
            steer.sub(this.velocity);
            steer.limit(this.maxforce);
        }
        return steer;
    }

    alignment(qt) {
        let neighbordistance = 50;
        let sum = createVector(0,0);
        let total = 0;
        let queried = qt.query(new Circle(this.location.x,this.location.y,neighbordistance));
        for(let q of queried) {
            let b = q.userData;
            sum.add(b.velocity);
            total++;
        }
        if(total > 0) {
            sum.div(total);
            sum.normalize();
            sum.mult(this.maxspeed);
            let steer = p5.Vector.sub(sum,this.velocity);
            steer.limit(this.maxforce);
            return steer;
        }
        else{
            return createVector(0,0);
        }
    }

    seek(target) {
        let desired = p5.Vector.sub(target,this.position);
        desired.normalize();
        desired.mult(this.maxspeed);
        let steer = p5.Vector.sub(desired,this.velocity);
        steer.limit(this.maxforce);
        return steer;
    }

    boundaries() {
        let bBox = 20;
        if(this.location.x >= width - bBox) {
            let desired = createVector(-1*this.maxspeed,this.velocity.y);
            let steer = p5.Vector.sub(desired,this.velocity);
            steer.limit(this.maxforce);
            this.applyForce(steer);
        }
        if(this.location.x <= bBox) {
            let desired = createVector(this.maxspeed,this.velocity.y);
            let steer = p5.Vector.sub(desired,this.velocity);
            steer.limit(this.maxforce);
            this.applyForce(steer);
        }
        if(this.location.y >= height - bBox) {
            let desired = createVector(this.velocity.x,-1*this.maxspeed);
            let steer = p5.Vector.sub(desired,this.velocity);
            steer.limit(this.maxforce);
            this.applyForce(steer);
        }
        if(this.location.y <= bBox) {
            let desired = createVector(this.velocity.x,this.maxspeed);
            let steer = p5.Vector.sub(desired,this.velocity);
            steer.limit(this.maxforce);
            this.applyForce(steer);
        }
    }
    
    applyForce(force) {
        this.acceleration.add(force);
    }

    seek(target) {
        let desired = p5.Vector.sub(target,this.location);
        desired.normalize();
        desired.mult(this.maxspeed);
        let steer = p5.Vector.sub(desired,this.velocity);
        steer.limit(this.maxforce);
        return steer;
    }

    update(qt) {
        let separation = this.separation(qt);
        let cohesion = this.cohesion(qt);
        let alignment = this.alignment(qt);

        separation.mult(1.42);
        cohesion.mult(0.2);
        alignment.mult(0.4);
      
        this.applyForce(alignment);
        this.applyForce(cohesion);
        this.applyForce(separation);

        this.boundaries();

        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxspeed);
        this.location.add(this.velocity);
        this.acceleration.mult(0);
    }

    draw() {
        let theta = this.velocity.heading() + PI/2;
        fill(175);
        stroke(0);
        push();
        if(this.alpha) fill('blue');
        translate(this.location.x,this.location.y);
        rotate(theta);
        strokeWeight(1);
        stroke('black');
        //triangle(0,this.r,this.r,this.r,this.r/2,0);
        triangle(-this.r/2,this.r/2,this.r/2,this.r/2,0,-this.r/2);
        /*strokeWeight(4);
        stroke('red');
        point(0,0);*/
        pop();
    }
}

class Point{
    constructor(x,y,data) {
        this.x = x;
        this.y = y;
        this.userData = data;
    }
}
class Rectangle{
    constructor(x,y,w,h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    contains(point) {
        return(point.x >= this.x -this.w &&
            point.x <= this.x + this.w &&
            point.y >= this.y - this.h &&
            point.y <= this.y + this.h);
    }
    intersects(range) {
        return !(range.x - range.w > this.x - this.w ||
            range.x + range.w < this.x - this.w ||
            range.y - range.h > this.y + this.h ||
            range.y + range.h < this.y - this.h);
        }
}
class Circle{
    constructor(x,y,r) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.rSquared = this.r * this.r;
    }
    contains(point) {
        let d = Math.pow((point.x - this.x), 2) + Math.pow((point.y - this.y), 2);
        return d <= this.rSquared;
    }
    intersects(range) {
        let xDist = Math.abs(range.x - this.x);
        let yDist = Math.abs(range.y - this.y);
        let r = this.r;
        let w = range.w;
        let h = range.h;
        let edges = Math.pow((xDist - w), 2) + Math.pow((yDist - h),2);
        if (xDist > (r + w) || yDist > (r + h)) return false;
        if (xDist <= w || yDist <= h) return true;
        return edges <= this.rSquared;
    }
}
class QuadTree{
    constructor(boundary, capacity) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.points = [];
        this.divided = false;
        this.node = [];
    }
    subdivide() {
        let x = this.boundary.x;
        let y = this.boundary.y;
        let w = this.boundary.w / 2;
        let h = this.boundary.h / 2;
        let node1 = new Rectangle(x - w, y - h, w, h);
        let node2 = new Rectangle(x + w, y - h, w, h);
        let node3 = new Rectangle(x + w, y + h, w, h);
        let node4 = new Rectangle(x - w, y + h, w, h);
        this.node[0] = new QuadTree(node1,this.capacity);
        this.node[1] = new QuadTree(node2,this.capacity);
        this.node[2] = new QuadTree(node3,this.capacity);
        this.node[3] = new QuadTree(node4,this.capacity);
        this.divided = true;
    }
    insert(point) {
        if(!this.boundary.contains(point)) return false;
        if(this.points.length < this.capacity) {
            this.points.push(point);
            return true;
        }
        if(!this.divided) this.subdivide();
        return(this.node[0].insert(point) || this.node[1].insert(point) ||
        this.node[2].insert(point) || this.node[3].insert(point))
    }
    query(range,found) {
        if(!found) found = [];
        if(!range.intersects(this.boundary)) return found;
        for(let p of this.points) {
            if(range.contains(p)) {
                found.push(p);
            }
        }
        if(this.divided) {
            this.node.forEach(node => {
                node.query(range,found);
            });
        }
        return found;
    }
}