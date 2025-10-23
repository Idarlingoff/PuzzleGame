import {Display} from "./Display.js";
import {Color} from "./core/enum/ColorEnum.js";
import {GoldenPlate} from "./core/plates/GoldenPlate.js";
import {PressurePlate} from "./core/plates/PressurePlate.js";
import {Player} from "./core/players/Player.js";
import {Shape} from "./core/enum/ShapeEnum.js";


const display = new Display(12, 8, 32);

const doors = [
    { x: 6, y: 4, color: Color.RED, open: false },
    { x: 7, y: 4, color: Color.WHITE, open: true }
];

const golden = new GoldenPlate(2, 2);
const redPlate = new PressurePlate(9, 6, Color.RED);

// simulateur : un joueur sur la golden, l’autre arrive
// golden.onPlayerEnter();

const p1 = new Player(1, 1, 1, Color.BLUE, Shape.CIRCLE);
const p2 = new Player(2, 8, 6, Color.RED, Shape.CIRCLE);

display.render({
    doors,
    plates: [golden, redPlate],
    players: [p1, p2]
});