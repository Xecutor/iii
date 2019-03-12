import { MapAccessor } from "./mapaccessor";
import { Player } from "./player";
import { RES } from "./resources";
import { DIR, Pos, dirY, dirX, diffToDir } from "./utils";

export interface AbilityCost{
    amount:number
    res:RES
}

export enum AbilityTargetType {
    none,
    direction,
    position,
    enemy
}

export class AbilityTarget {
    dir? : DIR
    pos? : Pos
}

export interface Ability {
    getTargetType() : AbilityTargetType
    activate(entity:Player, target?:AbilityTarget):void;
    getCost():AbilityCost[];
    getName():string;
}

export class ShieldRecharge implements Ability{
    static cost : AbilityCost[] = [
        {res:RES.idleCharge, amount: 2}
    ]
    getTargetType() {
        return AbilityTargetType.none
    }
    activate(entity:Player) {
        entity.getResource(RES.shield).add(20)
        entity.startFloatingText('20', 'lightblue', entity.pos.clone().add(0,1))
    }
    getCost() {
        return ShieldRecharge.cost;
    }
    getName() {
        return 'Shield Charge'
    }
}

export class JumpKick implements Ability {
    static cost : AbilityCost[] = [
        {res:RES.impulseCharge, amount: 3}
    ]
    getTargetType() {
        return AbilityTargetType.direction
    }
    activate(entity:Player, target:AbilityTarget) {
        const kickMaxRange = 5
        let ppos = entity.pos.clone()
        let pos = ppos.clone().add(dirX[target.dir], dirY[target.dir])
        for (let i = 0; i < kickMaxRange; ++i) {
            let ti = entity.map.mapPGet(pos)
            if(!ti.passable) {
                break
            }
            if(ti.hasBlockingEntity()) {
                break;
            }
            ppos.assign(pos)
            pos.addDir(target.dir)
        }
        entity.moveTo(ppos)
        let ti = entity.map.mapPGet(pos)
        if(ti.hasBlockingEntity()) {
            let e = ti.entities.find(e=>e.isEnemy)
            if(e) {
                e.receiveDamage(50, entity)
                e.move(diffToDir(ppos.x, ppos.y, e.pos.x, e.pos.y))
                e.stun(1)
            }
        }
    }
    getCost() {
        return JumpKick.cost;
    }
    getName() {
        return 'Jump kick'
    }
}

export class StunningSmash implements Ability {
    static cost : AbilityCost[] = [
        {res:RES.impactCharge, amount: 3}
    ]
    activate(entity:Player, target:AbilityTarget) {
        let pos = entity.pos.clone().addDir(target.dir)
        let ti = entity.map.mapPGet(pos)
        if(ti.hasBlockingEntity()) {
            let e = ti.entities.find(e=>e.isEnemy)
            if(e) {
                e.receiveDamage(50, entity)
                e.stun(4)
            }
        }
    }
    getTargetType() {
        return AbilityTargetType.direction
    }
    getCost() {
        return StunningSmash.cost;
    }
    getName() {
        return 'Stunning smash'
    }
}