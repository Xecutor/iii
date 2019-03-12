import { Entity } from "./entity";
import { uiManager } from "./uimanager";
import { OneTimeAnimation } from "./animation";
import { TileManager } from "./tilemanager";

export class Door extends Entity {
    isVertical: boolean
    isLocked: boolean
    isBlocked: boolean
    wasClosed:boolean
    constructor(isVertical: boolean, isLocked: boolean) {
        super()
        this.isVertical = isVertical
        this.isLocked = isLocked
        this.updateTileName()
    }
    onTurn() {
    }
    getDescription() {
        return this.isBlocked ? 'Blocked door' : this.isLocked ? 'Locked Door' : 'Door'
    }
    receiveDamage() {
    }
    updateTileName() {
        if (this.isBlocked) {
            this.tileName = this.isVertical ? 'door-v-blocked' : 'door-h-blocked'
        } else if (this.isLocked) {
            this.tileName = this.isVertical ? 'door-v-locked' : 'door-h-locked'
        }
        else {
            this.tileName = this.isVertical ? 'door-v' : 'door-h'
        }
    }
    block() {
        this.wasClosed = this.blocking
        this.isBlocked = true
        this.blocking = true
        this.updateTileName()
    }
    unblock() {
        this.blocking = this.wasClosed
        this.isBlocked = false
        this.updateTileName()
    }
    interactWith() {
        if(this.isBlocked) {
            return false
        }
        if (this.isLocked) {
            this.isLocked = false;
            this.updateTileName();
            return true;
        }
        this.blocking = false
        uiManager.addAnimation(new OneTimeAnimation(f => this.onFrame(f), TileManager.instance.getTileFrames(this.tileName)))
        return true;
    }
}
