import { Entity } from "./entity";

export interface Program {
    cpuCost:number;
    memCost:number;
    hddSize:number;
    name:string;
    descr:string;
    isBackground:boolean;
    loaded?:boolean;
    backgroundStep?():void;
    execute?(target:Entity):void;
    onAttack?(target:Entity):void;
}

export class SecurityAnalyzer implements Program{
    cpuCost=3;
    memCost=2;
    hddSize=5;
    dmg=25;
    name="Security analyzer";
    descr=`Reduces integrity of malicious target by ${this.dmg}.`;
    isBackground=false;
    execute(target:Entity)
    {

    }
}

export class BruteForce implements Program {
    cpuCost=1;
    memCost=4;
    hddSize=4;
    dmg=30;
    loaded=false;
    name="Brute force attack";
    descr=`Reduces integrity of malicious target on contact by ${this.dmg}.`;
    isBackground=true;
    onAttack(target:Entity)
    {

    }
}