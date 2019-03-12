export class Resource {
    descr: string;
    color: string;
    value: number = 0;
    maxValue: number;
    constructor(descr: string, color: string) {
        this.descr = descr;
        this.color = color;
    }
    setMaxValue(maxValue:number) {
        this.maxValue = maxValue
        this.value = maxValue
    }
    isAtMax() {
        return this.value >= this.maxValue
    }
    add(value: number) {
        this.value += value
        if (this.value > this.maxValue) {
            this.value = this.maxValue
        }
        return this.value
    }
    sub(value: number) : number {
        let toSub = Math.min(this.value, value)
        this.value -= toSub
        value -= toSub
        return value
    }
}

export enum RES {
    health,
    shield,
    idleCharge,
    impulseCharge,
    impactCharge,
    count
}
