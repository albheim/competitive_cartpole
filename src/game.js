var canvas = document.getElementById("gameArea");
var ctx = canvas.getContext("2d");

// Constants
const cartWidth = 50;
const cartHeight = 30;
const pendulumLength = 150;
const pendulumWidth = 2;
const pendulumRadius = 10;
const cartY = canvas.height - cartHeight;
const score_factor = 0.001;
const showforce = false;

const m = 2;  // pendulum mass
const M = 1;  // cart mass
const g = 800;  // gravity
const l = pendulumLength;  // pendulum length
const dt = 0.02;  // time step
const force_mag = 1500;  // external force, should be updated based on user input

function draw_cartpole(x, theta, force, c1, c2) {
    // Draw the cart
    ctx.fillStyle = c1;
    ctx.fillRect(x, cartY, cartWidth, cartHeight);

    // Calculate the pendulum's end point
    var pendulumEndX = x + cartWidth / 2 - pendulumLength * Math.sin(theta);
    var pendulumEndY = cartY - pendulumLength * Math.cos(theta);

    // Draw the pendulum
    ctx.strokeStyle = c2;
    ctx.lineWidth = pendulumWidth;
    ctx.beginPath();
    ctx.moveTo(x + cartWidth / 2, cartY);
    ctx.lineTo(pendulumEndX, pendulumEndY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pendulumEndX, pendulumEndY, pendulumRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Draw the force
    if (showforce && force != 0) {
        x0 = x;
        x1 = x - 50;
        if (force > 0) {
            x0 += cartWidth;
            x1 = x0 + 50;
        }

        ctx.strokeStyle = c2;
        ctx.lineWidth = 4;
    
        ctx.beginPath();
        ctx.moveTo(x0, cartY+cartHeight/2);
        ctx.lineTo(x1, cartY+cartHeight/2);
        ctx.stroke();
    }
}

function draw(player_state, controller_state, player_force, controller_force, done) {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (done > 0) {
        ctx.fillStyle = "red";
        if (done == 1) {
            ctx.fillText("Failed", 200, 30); 
        } else if (done == 2) {
            ctx.fillText("Failed", 200, 60);
        }
        ctx.font = "48px Serif";
        ctx.fillStyle = "black";
        ctx.fillText("Press space to start", 190, 230);
        ctx.font = "24px Serif";
        ctx.fillText("Keep the pendulum balanced, while keeping the cart close to the target.", 80, 330);
    } else {
        // Draw the target
        ctx.lineWidth = 2;
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.moveTo(targetX + cartWidth / 2, 0);
        ctx.lineTo(targetX + cartWidth / 2, canvas.height);
        ctx.stroke();
    }
    // Draw cartpoles
    draw_cartpole(controller_state[0], controller_state[2], controller_force, "gray", "lightgray");
    draw_cartpole(player_state[0], player_state[2], player_force, "blue", "lightblue");

    // Draw the score
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Player score: " + player_score.toPrecision(5), 10, 30);
    ctx.fillText("Controller score: " + controller_score.toPrecision(5), 10, 60);
}


var player_state = [(canvas.width - cartWidth)/2, 0, 0, 0];  // initial state: [x, x_dot, theta, theta_dot]
var player_score = 0;
var player_high_score = 0;
var controller_state = [(canvas.width - cartWidth)/2, 0, 0, 0];  // initial state: [x, x_dot, theta, theta_dot]
var controller_score = 0;
var targetX = (canvas.width - cartWidth) / 2;

var keys = {};
window.addEventListener('keydown', function(e) {
    keys[e.key] = true;
});
window.addEventListener('keyup', function(e) {
    keys[e.key] = false;
});

function step(state, force) {

    // Implementing the RK4 method
    var k1 = cartpole_dynamics(state, force);
    var k2 = cartpole_dynamics(vecadd(state, vecscale(k1, dt/2)), force);
    var k3 = cartpole_dynamics(vecadd(state, vecscale(k2, dt/2)), force);
    var k4 = cartpole_dynamics(vecadd(state, vecscale(k3, dt)), force);
    
    var k = vecadd(vecadd(k1, vecscale(k2, 2)), vecadd(vecscale(k3, 2), k4));

    state = vecadd(state, vecscale(k, dt/6));

    state[1] = state[1] * 0.99;
    state[3] = state[3] * 0.999999;

    return state;
}

function cartpole_dynamics(state, force) {
    // https://courses.ece.ucsb.edu/ECE594/594D_W10Byl/hw/cartpole_eom.pdf
    // x increases to the right
    // theta is zero up, and increace counter clockwise

    // Unpack the state
    var [x, x_dot, theta, theta_dot] = state;
    
    // The equations of motion
    var x_dotdot = (force - m*l*Math.pow(theta_dot, 2)*Math.sin(theta) + m*g*Math.sin(theta)*Math.cos(theta)) / (M + m*(1 - Math.pow(Math.cos(theta), 2)));
    var theta_dotdot = (force * Math.cos(theta) + (M + m) * g * Math.sin(theta) - m * l * Math.pow(theta_dot, 2) * Math.sin(theta) * Math.cos(theta)) / ((M + m) * l - m * l * Math.pow(Math.cos(theta), 2))

    return [x_dot, x_dotdot, theta_dot, theta_dotdot];
}

function vecadd(v1, v2) {
    return v1.map((val, i) => val + v2[i]);
}

function vecscale(v, c) {
    return v.map(val => c * val);
}

function update_player(state) {
    // Update the force based on user input
    var force = 0;
    if (keys["ArrowRight"]) {
        force = force_mag;
    } else if (keys["ArrowLeft"]) {
        force = -force_mag;
    }

    return force;
}

function simple_controller(state) {
    errx = state[0] - targetX;
    theta_target = 0.001 * errx;
    theta = state[2];
    var force = 0;
    if (theta > theta_target) {
        force = -force_mag;
    } else if (theta < theta_target) {
        force = force_mag;
    }
    return force;
}

function pid_controller(state) {
    return 0;
}

function lqr_controller(state) {
    force = 9 * (state[0] - targetX) + 13 * state[1] - 10000 * state[2] - 3700 * state[3];
    return force_mag * Math.sign(force);
}

function isDone(state) {
    return state[0] < 0 || state[0] > canvas.width - cartWidth || Math.abs(state[2]) > Math.PI/2;
}

var done = true;
var count = 0;
var noise_amp = 0.0003;
draw(player_state, controller_state, 0, 0, 3);
function main() {
    if (keys[" "]) {
        player_state = [(canvas.width - cartWidth)/2, 0, 0, 0];
        controller_state = [(canvas.width - cartWidth)/2, 0, 0, 0];
        player_score = 0;
        controller_score = 0;
        count = 0;
        targetX = (canvas.width - cartWidth) / 2;
        done = false;
    }
    if (!done) {
        count += 1;
        if (count % 200 == 0) {
            targetX = (Math.random() * 0.8 + 0.1) * canvas.width - cartWidth/2;
            noise_amp *= 1.01;
        }
        theta_noise = noise_amp * Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());

        player_force = update_player(player_state);
        player_state = step(player_state, player_force);
        player_state[2] += theta_noise;
        player_score += score_factor * (canvas.width - Math.abs(player_state[0] - targetX));

        controller_force = lqr_controller(controller_state);
        controller_state = step(controller_state, controller_force);
        controller_state[2] += theta_noise;
        controller_score += score_factor * (canvas.width - Math.abs(controller_state[0] - targetX));

        done = 1 * isDone(player_state) + 2 * isDone(controller_state);
        draw(player_state, controller_state, player_force, controller_force, done);
    }
}

setInterval(main, dt*1000);
