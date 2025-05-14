const fs = require('fs');
const { createCanvas, loadImage} = require('canvas');
const { Sign } = require('crypto');
let canvas = createCanvas(3000, 600);
let context = canvas.getContext('2d');

let faultDuration = 10;//cycles
var pV = 100*Math.sqrt(2);
var frequency = 60;
var omega = 2 * Math.PI * frequency;//angular frequency
var SPC = 32;//samples per cycle
var period = 1/frequency;
var SInt = period/SPC; //sampling interval
let faultMf = 0.05;
function Gwave(sN){
    let mf = 1;
    let sinp = SInt * sN * omega;
    if(sN>1000 && sN<(1000+faultDuration*SPC)){
        //mf = mf/(10*(sN-1000))
        mf = faultMf;
    }else{
        mf = 1;
    }
    let output = {
        Va : pV * (Math.sin(sinp) + Math.sin(sinp * 2+0.2) * 0.00 + Math.sin(sinp * 3+0.6) * 0.00 + Math.sin(sinp * 5+0.8) * 0.0) * mf,
        Vb : pV * (Math.sin(sinp - Math.PI*(2/3)))*mf,
        Vc : pV * (Math.sin(sinp + Math.PI*(2/3)))*mf
    }//ABC Positive sequence
    return output;

};






let pValues = {Va:0,Vb:0,Vc:0,VaRMS:0,VbRMS:0,VcRMS:0,sVaRMS:0,sVbRMS:0,sVcRMS:0};

const ts = 10; //time scalling factor
const vs = 0.5; //voltage scalling factor
let sqAvg = {Va:0,Vb:0,Vc:0};
const wF = 12/16; //weight factor (lambda)
let b = (wF/SInt);
function simRMS(sN,phaseShift=0){
    let t = sN*SInt;
    let a = 2*omega*t+2*SInt+phaseShift*2;
    let fUp=(b)*Math.cos(a)+2*omega*Math.sin(a);
    //let squared = pV**2/2 - (pV**2/2)*(wF/SInt)*fUp/(wF/SInt);
    let mf = 1;
    if(sN>1000 && sN<(1000+faultDuration*SPC)){
        mf=faultMf;
    }else{
        mf=1;
    }
    let squared = (mf*pV)**2/2 * (1- (b)*fUp/(b**2+4*omega**2));
    //console.log("squared:"+squared)
    return Math.sqrt(squared);

}


//over and under voltage/current detection
let minV = 10;
let maxV = 110;
let minVsqr = minV**2 * (1- (b)*Math.sqrt(b**2+(2*omega)**2)/(b**2+4*omega**2));
let maxVsqr = maxV**2 * (1+ (b)*Math.sqrt(b**2+(2*omega)**2)/(b**2+4*omega**2));
// minVsqr2 and maxVsqr used to detect when the fault is over
let minVsqr2 = minV**2 * (1+ (b)*Math.sqrt(b**2+(2*omega)**2)/(b**2+4*omega**2));
let maxVsqr2 = maxV**2 * (1- (b)*Math.sqrt(b**2+(2*omega)**2)/(b**2+4*omega**2));

let fD = {a: false, b: false, c:false};
let fT = {a: 0, b:0, c:0};
let faultOn = false;
let faultStart = 0;

console.log("Samples per cycle:" + SPC + "\nWeight factor(lambda):" + wF*16+"/16");
console.log("detection:"+"minRMS:"+minV+" maxRMS:"+maxV)
for(let i = 0; i < 1700; i++){
    let signal = Gwave(i);
    sqAvg.Va = wF*signal.Va**2+(1-wF)*sqAvg.Va;
    sqAvg.Vb = wF*signal.Vb**2+(1-wF)*sqAvg.Vb;
    sqAvg.Vc = wF*signal.Vc**2+(1-wF)*sqAvg.Vc;
    
    let vRMS = 
    {
        Va:Math.sqrt(sqAvg.Va),
        Vb:Math.sqrt(sqAvg.Vb),
        Vc:Math.sqrt(sqAvg.Vc)
    }
    let sRMS = {};
    sRMS.Va = simRMS(i);
    sRMS.Vb = simRMS(i,- Math.PI*(2/3));
    sRMS.Vc = simRMS(i,  Math.PI*(2/3));
    if(i>950){
        //console.log("sqAvg.VA:"+sqAvg.Va);
        //console.log("vRMS.VA:"+vRMS.Va);
        //console.log("vSRMS.VA:"+sRMS.Va);
        //console.log("-----")
        //phase A
        context.strokeStyle = "red";
        context.beginPath();
        context.moveTo((i-1-950)*ts,100-pValues.Va*vs);
        context.lineTo((i-950)*ts,100-signal.Va*vs);
        context.stroke();

        //phase B
        context.strokeStyle = "blue";
        context.beginPath();
        context.moveTo((i-1-950)*ts,300-pValues.Vb*vs);
        context.lineTo((i-950)*ts,300-signal.Vb*vs);
        context.stroke();

        //phase C
        context.strokeStyle = "green";
        context.beginPath();
        context.moveTo((i-1-950)*ts,500-pValues.Vc*vs);
        context.lineTo((i-950)*ts,500-signal.Vc*vs);
        context.stroke();

        //MOVING RMS
        //phase A
        context.strokeStyle = "darkgreen";
        context.beginPath();
        context.moveTo((i-1-950)*ts,100-pValues.VaRMS*vs);
        context.lineTo((i-950)*ts,100-vRMS.Va*vs);
        context.stroke();

        //phase B
         context.strokeStyle = "cyan";
         context.beginPath();
         context.moveTo((i-1-950)*ts,300-pValues.VbRMS*vs);
         context.lineTo((i-950)*ts,300-vRMS.Vb*vs);
         context.stroke();

        //phase C
        context.strokeStyle = "yellow";
        context.beginPath();
        context.moveTo((i-1-950)*ts,500-pValues.VcRMS*vs);
        context.lineTo((i-950)*ts,500-vRMS.Vc*vs);
        context.stroke();

        //SIMULATED RMS PHASE A
        context.strokeStyle = "gold";
        context.setLineDash([2, 7.5]);
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo((i-1-950)*ts,100-pValues.sVaRMS*vs);
        context.lineTo((i-950)*ts,100-sRMS.Va*vs);
        context.stroke();
        context.setLineDash([]);
        context.lineWidth = 1;

        //SIMULATED RMS PHASE B
        context.strokeStyle = "gold";
        context.setLineDash([2, 7.5]);
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo((i-1-950)*ts,300-pValues.sVbRMS*vs);
        context.lineTo((i-950)*ts,300-sRMS.Vb*vs);
        context.stroke();
        context.setLineDash([]);
        context.lineWidth = 1;

        //SIMULATED RMS PHASE C
        context.strokeStyle = "gold";
        context.setLineDash([2, 7.5]);
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo((i-1-950)*ts,500-pValues.sVcRMS*vs);
        context.lineTo((i-950)*ts,500-sRMS.Vc*vs);
        context.stroke();
        context.setLineDash([]);
        context.lineWidth = 1;

    
        //detection
        //PHASE A
        if(sqAvg.Va > maxVsqr || sqAvg.Va < minVsqr){
            
            context.strokeStyle = "black";
            context.beginPath();
            context.moveTo((i-950)*ts,0);
            context.lineTo((i-950)*ts,200);
            context.stroke();
            if(!fD.a){
                console.log("under or over voltage or current detected on phase A:"+(i-1000)*SInt*1000 + "ms,"+(i-1000)/SPC+"Cycles");
            }

            fD.a = true;

        }else{
            if(sqAvg.Va >= minVsqr2 && sqAvg.Va <= maxVsqr2){
                fD.a = false;
            }
            
        }
        //PHASE B
        if(sqAvg.Vb > maxVsqr || sqAvg.Vb < minVsqr){
            
            context.strokeStyle = "black";
            context.beginPath();
            context.moveTo((i-950)*ts,200);
            context.lineTo((i-950)*ts,400);
            context.stroke();
            if(!fD.b){
                console.log("under or over voltage or current detected on phase B:"+(i-1000)*SInt*1000 + "ms,"+(i-1000)/SPC+"Cycles");
                
            }
            fD.b = true;
        }else{
            if(sqAvg.Vb >= minVsqr2 && sqAvg.Vb <= maxVsqr2){
              fD.b = false;  
            }
            
        }
        //PHASE C
        if(sqAvg.Vc > maxVsqr || sqAvg.Vc < minVsqr){
            
            context.strokeStyle = "black";
            context.beginPath();
            context.moveTo((i-950)*ts,400);
            context.lineTo((i-950)*ts,600);
            context.stroke();
            if(!fD.c){
                console.log("under or over voltage or current detected on phase C:"+(i-1000)*SInt*1000 + "ms,"+(i-1000)/SPC+"Cycles");
            }
            fD.c = true;
        }else{
            if(sqAvg.Vc >= minVsqr2 && sqAvg.Vc <= maxVsqr2){
                fD.c = false;
            }            
        }
        if(!faultOn && (fD.a || fD.b || fD.c)){
            faultStart = i - 1000;
            console.log("!!Fault detected:" + (i-1000)/SPC +"Cycles");
            faultOn = true;
        }else if(faultOn && !(fD.a || fD.b || fD.c)){
            console.log("!!Fault ended. Duration:"+((i-1000)-faultStart)/SPC+"Cycles");
            faultOn = false;
        }

    }
    pValues.Va = signal.Va;
    pValues.Vb = signal.Vb;
    pValues.Vc = signal.Vc;
    pValues.VaRMS = vRMS.Va;
    pValues.VbRMS = vRMS.Vb;
    pValues.VcRMS = vRMS.Vc;
    pValues.sVaRMS = sRMS.Va;
    pValues.sVbRMS = sRMS.Vb;
    pValues.sVcRMS = sRMS.Vc;
}
let maxSVrms = Math.sqrt(pV**2/2 * (1+ (b)*Math.sqrt(b**2+(2*omega)**2)/(b**2+4*omega**2)));
let minSVrms = Math.sqrt(pV**2/2 * (1- (b)*Math.sqrt(b**2+(2*omega)**2)/(b**2+4*omega**2)));
//drawing max
/*context.strokeStyle = "gray";
context.beginPath();
context.moveTo(0,100-maxSVrms*vs);
context.lineTo(1000,100-maxSVrms*vs);
context.stroke();
//drawing min
context.strokeStyle = "gray";
context.beginPath();
context.moveTo(0,100-minSVrms*vs);
context.lineTo(1000,100-minSVrms*vs);
context.stroke();
*/

console.log("maxSVrms:"+maxSVrms);
console.log("minSVrms:"+minSVrms);

try {
    let buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('./outDetection.png', buffer);
  } catch (error) {
    console.error(error);
  }
  console.log(process.cwd());