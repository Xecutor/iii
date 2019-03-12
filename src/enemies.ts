import { AI, FleeingAI, AgressiveMeleeAI } from './ai';
import { TileManager } from './tilemanager';
import { FwdAndBackAnimation } from './animation';
import { uiManager } from './uimanager';
import { Entity } from './entity';
import { Effect } from './effect';

abstract class EnemyBase extends Entity {
    ai: AI;
    hp: number = 100;
    stunTurns : number = 0
    isEnemy = true
    onTurn() {
        if(this.stunTurns>0) {
            --this.stunTurns
            if (this.stunTurns == 0) {
                this.cancelEffect('stun')
            }
        }
        else {
            this.ai.think(this);
        }
    }
    animate() {
        uiManager.addAnimation(new FwdAndBackAnimation((frame) => this.onFrame(frame), TileManager.instance.getTileFrames(this.tileName) - 1));
    }
    receiveDamage(val: number, source?: Entity) {
        if (val > 0) {
            this.startFloatingText(val.toString(), 'red', source?source.pos:this.pos.clone().add(-1,1))
        }
        this.hp -= val;
        if (this.hp <= 0) {
            this.alive = false;
        }
    }
    getHp() {
        return this.hp
    }
    stun(stunTurns:number) {
        if (stunTurns > this.stunTurns) {
            this.stunTurns = stunTurns
        }
        if (this.stunTurns > 0) {
            if (!this.hasEffect('stun')) {
                this.addEffect(new Effect('stun', 'stun-effect'))
            }
        }
    }
}

export class Muncher extends EnemyBase {
    constructor() {
        super();
        this.ai = new AgressiveMeleeAI();
        this.tileName = 'muncher';
        this.animate();
    }
    getDamage() {
        return 10
    }
    getDescription() {
        return 'Muncher';
    }
}

export class Spyware extends EnemyBase {
    constructor() {
        super();
        this.ai = new FleeingAI();
        this.tileName = 'spyware';
        this.animate();
    }
    getDescription() {
        return 'Spyware';
    }
}
