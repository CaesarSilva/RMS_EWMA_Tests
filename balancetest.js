const fs = require('fs');
const { createCanvas, loadImage} = require('canvas');
let canvas = createCanvas(3000, 600);
let context = canvas.getContext('2d');

var pV = 127*Math.sqrt(2);
var frequency = 60;
var omega = 2 * Math.PI * frequency;//angular frequency
var SPC = 16;//samples per cycle
var period = 1/frequency;
var SInt = period/SPC; //sampling interval

function Gwave(sN){
    let mf = 1;
    if(sN>1000){
        //mf = mf/(10*(sN-1000))
        mf = 0.0;
    }
    let output = {
        Va : pV * Math.sin(SInt * sN * omega) * mf,
        Vb : pV * Math.sin(SInt * sN * omega - Math.PI*(2/3))*mf,
        Vc : pV * Math.sin(SInt * sN * omega + Math.PI*(2/3))*mf
    }//ABC Positive sequence
    return output;

};





let pValues = {Va:0,Vb:0,Vc:0,VaRMS:0,VbRMS:0,VcRMS:0,sVaRMS:0,sVbRMS:0,sVcRMS:0};

const ts = 10; //time scalling factor
const vs = 0.5; //voltage scalling factor
let sqAvg = {Va:0,Vb:0,Vc:0};
const wF = 8/16; //weight factor
let b = (wF/SInt);
function simRMS(sN,phaseShift=0){
    let t = sN*SInt;
    let a = 2*omega*t+2*SInt+phaseShift*2;
    let fUp=(b)*Math.cos(a)+2*omega*Math.sin(a);
    //let squared = pV**2/2 - (pV**2/2)*(wF/SInt)*fUp/(wF/SInt);
    let squared = pV**2/2 * (1- (b)*fUp/(b**2+4*omega**2));
    //console.log("squared:"+squared)
    return Math.sqrt(squared);

}
for(let i = 0; i < 1100; i++){
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
        console.log("sqAvg.VA:"+sqAvg.Va);
        console.log("vRMS.VA:"+vRMS.Va);
        console.log("vSRMS.VA:"+sRMS.Va);
        console.log("-----")
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

        //RMS
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
context.strokeStyle = "gray";
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


console.log("maxSVrms:"+maxSVrms);
console.log("minSVrms:"+minSVrms);

try {
    let buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('./out.png', buffer);
  } catch (error) {
    console.error(error);
  }
  console.log(process.cwd());