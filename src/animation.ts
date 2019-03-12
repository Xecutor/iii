export interface Animation{
    nextFrame():boolean;
}

export class FwdAndBackAnimation implements Animation {
    minFrame:number;
    maxFrame:number;
    frame:number;
    dir: number;
    onFrame:(frame:number)=>boolean;

    constructor(onFrame:(frame:number)=>boolean, maxFrame:number, minFrame:number=0)
    {
        this.onFrame=onFrame;
        this.maxFrame=maxFrame;
        this.minFrame=minFrame;
        this.frame=minFrame;
        this.dir=1;
    }
    nextFrame():boolean
    {
        this.frame+=this.dir;
        if(this.frame>=this.maxFrame || this.frame<=this.minFrame) {
            this.dir=-this.dir;
        }
        return this.onFrame(this.frame);
    }
}

export class CyclicAnimation implements Animation {
    minFrame:number;
    maxFrame:number;
    frame:number;
    onFrame:(frame:number)=>boolean;

    constructor(onFrame:(frame:number)=>boolean, maxFrame:number, minFrame:number=0, startFrame:number=minFrame)
    {
        this.onFrame=onFrame;
        this.maxFrame=maxFrame;
        this.minFrame=minFrame;
        this.frame=startFrame;
    }
    nextFrame():boolean
    {
        this.frame+=1;
        if(this.frame>=this.maxFrame) {
            this.frame=this.minFrame;
        }
        return this.onFrame(this.frame);
    }
}

export class OneTimeAnimation implements Animation {
    maxFrame:number;
    frame:number;
    dir:number
    onFrame:(frame:number)=>boolean;

    constructor(onFrame:(frame:number)=>boolean, maxFrame:number, startFrame:number=0)
    {
        this.onFrame=onFrame;
        this.maxFrame=maxFrame;
        this.frame=startFrame;
        this.dir = startFrame>maxFrame ? -1 : 1
    }
    nextFrame():boolean
    {
        this.frame+=this.dir;
        if(this.dir>0?this.frame>=this.maxFrame:this.frame<=this.maxFrame) {
            return false
        }
        return this.onFrame(this.frame);
    }
}