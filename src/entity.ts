import { dirX, dirY, DIR, pdiffToDir } from './utils';
import { MapAccessor } from "./mapaccessor";
import { Pos } from './utils';
import { FloatingTextAni } from './floatingtext';
import { uiManager } from './uimanager';
import { tileSize } from './tilemanager';
import { Effect } from './effect';

export abstract class Entity {
    tileName: string;
    tileFrame: number = 0;
    pos = new Pos();
    isEnemy?: boolean
    isPlayer?: boolean
    alive = true;
    blocking = true
    speed = 1
    map: MapAccessor

    effects : Effect[] = []

    onFrame(frame: number) {
        this.tileFrame = frame;
        return this.alive;
    }
    abstract getDescription(): string;
    abstract receiveDamage(val: number, source?: Entity): void;

    onTurn() {
    }

    interactWith() {
        return true
    }

    getDamage() {
        return 0
    }

    onMove() { }

    getHp() {
        return 0
    }

    stun(turns:number) {
    }
    hasEffect(id:string) {
        return this.effects.some(e=>e.id==id)
    }
    addEffect(effect:Effect) {
        this.effects.push(effect)
    }
    cancelEffect(id:string) {
        this.effects = this.effects.filter(e=>e.id!=id)
    }

    startFloatingText(txt: string, clr: string, src: Pos) {
        let dir = pdiffToDir(src, this.pos)
        let dpos = new Pos(dirX[dir], dirY[dir]).mul(tileSize / 4)
        uiManager.addAnimation(new FloatingTextAni(txt, clr, this.map.mapToScreen(this.pos).add(tileSize / 2, tileSize / 2), dpos))
    }

    moveTo(pos: Pos) {
        let map = this.map
        let dst = pos.clone();
        let srcTi = map.mapGet(this.pos.x, this.pos.y);
        let dstTi = map.mapGet(dst.x, dst.y);
        if (dstTi.hasBlockingEntity()) {
            return false;
        }
        dstTi.addEntity(this)
        srcTi.removeEntity(this)
        this.pos = dst;
        return true
    }

    move(dir: DIR) {
        let dst = this.pos.clone();
        dst.x += dirX[dir];
        dst.y += dirY[dir];
        if (this.moveTo(dst)) {
            this.onMove()
        }
    }
}
