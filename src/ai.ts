import { Pos, diffToDir } from './utils';
import { MapAccessor } from "./mapaccessor";
import { Entity } from "./entity";

export interface AI {
    think(self: Entity): void;
}

export class AgressiveMeleeAI implements AI {
    think(self: Entity) {
        let srcPos = self.pos
        let p = self.map.getPlayer()
        let dstPos = p.pos
        if (srcPos.manhattanDistanceTo(dstPos) == 1) {
            p.receiveDamage(self.getDamage(), self)
        }
        else {
            let path = self.map.calcPath(srcPos, dstPos)
            if (path.length > 1) {
                self.move(diffToDir(self.pos.x, self.pos.y, path[1].x, path[1].y))
            }
        }
    }
}

export class FleeingAI implements AI {

    think(self: Entity) {
        let r = self.pos.makeRectAround(10);
        let dangerPos: Array<Pos> = [];
        console.log(`my pos ${self.pos.x},${self.pos.y}`);
        for (let it = r.getIterator(); it.next();) {
            let ti = self.map.mapPGet(it.value);
            if (!ti) continue;
            if (ti.hasEntities()) {
                dangerPos.push(it.value.clone());
                console.log(`danger source ${it.value.x},${it.value.y}`);
            }
        }
        if (dangerPos.length) {
            self.map.floodMap(dangerPos, 10);
        }
    }
}