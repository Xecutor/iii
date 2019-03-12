import { Resource, RES } from './resources';
import { Entity } from './entity';
import { idleColor, impulseColor, impactColor } from './colors';
import { Ability, ShieldRecharge, JumpKick, StunningSmash } from './abilities';

export class Player extends Entity {
    isPlayer = true

    resources: Array<Resource> = [
        new Resource('Health', 'green'),
        new Resource('Shield', 'lightblue'),
        new Resource('Idle', idleColor),
        new Resource('Impulse', impulseColor),
        new Resource('Impact', impactColor),
    ];

    abilities: Ability[] = []

    type: number
    damageReceived = 0
    stunStrength = 0

    constructor(type: number) {
        super();
        this.type = type
        this.tileName = 'player-' + type;
        this.resources[RES.health].setMaxValue(100);
        this.resources[RES.shield].setMaxValue(type == 1 ? 30 : 0);
        this.resources[RES.idleCharge].maxValue = 3;
        this.resources[RES.impactCharge].maxValue = 3;
        this.resources[RES.impulseCharge].maxValue = 3;

        if (type == 1) {
            this.abilities.push(new ShieldRecharge)
        }
        else if (type == 2) {
            this.abilities.push(new JumpKick)
        }
        else if (type == 3) {
            this.stunStrength = 2
            this.abilities.push(new StunningSmash)
        }
    }
    getResource(idx: number) {
        return this.resources[idx];
    }
    getDescription() {
        return 'Player';
    }
    getDamage() {
        return 25
    }
    getStunStrength() {
        return this.stunStrength
    }
    receiveDamage(val: number, source?: Entity) {
        let srcPos = source ? source.pos : this.pos.clone().add(-1, 1)
        if (this.resources[RES.shield].value > 0) {
            let prev = val
            val = this.resources[RES.shield].sub(val)
            let blocked = prev - val
            this.startFloatingText(blocked.toString(), 'lightblue', srcPos)
        }
        if (val > 0) {
            this.startFloatingText(val.toString(), 'green', srcPos)
        }
        this.resources[RES.health].value -= val;
        if (this.resources[RES.health].value <= 0) {
            this.alive = false;
        }
        this.damageReceived = 2
    }
    shieldRegen() {
        if (this.damageReceived) {
            --this.damageReceived
        }
        else {
            this.resources[RES.shield].add(5)
        }
    }
    onMove() {
        this.resources[RES.idleCharge].sub(1)
        this.resources[RES.impulseCharge].add(1)
        this.resources[RES.impactCharge].sub(1)
        this.shieldRegen()
    }
    onAttack() {
        this.resources[RES.idleCharge].sub(1)
        this.resources[RES.impulseCharge].sub(1)
        this.resources[RES.impactCharge].add(1)
    }
    onPassTurn() {
        this.resources[RES.idleCharge].add(1)
        this.resources[RES.impulseCharge].sub(1)
        this.resources[RES.impactCharge].sub(1)
        this.shieldRegen()
    }
    getAbilitties() {
        return this.abilities
    }
    spendAbilityCose(a: Ability) {
        for (let c of a.getCost()) {
            this.getResource(c.res).sub(c.amount)
        }
    }
}