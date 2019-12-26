/**
 * 将url 附带的信息 解析成对象
 *
 * return obj
 */

const analysisUrl = (url) => {
    if(!url){
        url = window.location.search;
    }
    const getUrlSearch = (str)=>{
        const reg= /\?.+/g;
        str = (str.match(reg)||[])[0]||'';
        const reg2= /\#\/|\#\/.+/g;
        str = str.replace(reg2,'');
        return  str.substr(1);
    };


    let obj = {};

    const reqUrl =getUrlSearch(url);

    const keyValue = reqUrl.split('&') || [];

    keyValue.forEach((item = '') => {
        const final = item.split('=');
        if (final.length === 2) {
            obj[final[0]] = final[1]
        }
    });
    return obj
};

const assembling=(url, params)=>{
    let keys = Object.keys(params);
    let query = [];

    keys.forEach((key, i) => {
        let value = params[key];
        if (value !== null) {
            query.push(key + '=' + encodeURIComponent(value));
        }
    });

    if(!query.length){
        return url
    }

    if (url.lastIndexOf('?') > 0) {
        url = url + "&" + query.join('&');
    } else {
        url = url + "?" + query.join('&');
    }
    return url;
};

const  matchingWindowsHost=(w)=> {
    const nowHost = w.location.host;
    const nurseHost = "https://nurse.homeking365.com";
    let host = nurseHost;

    if(nowHost.indexOf("hktqa")!=-1){ // qa 环境
        host ="http://nurse.hktqa.cn";
    }else if(nowHost.indexOf("hktrd")!=-1){  // rd 环境
        host ="http://mnurse.hktrd.cn";
    }else if(nowHost.indexOf("hkdev")!=-1){ // dev 环境
        host ="http://nurse.hkdev.cn";
    }
    w.nurse.host = host
};

/**
 * 让url自动添加上 页面地址上的追踪码
 *
 * 1）增加追踪码
 * 2）若为测试环境，需要分析页面地址，换成对应的测试环境下的地址
 * @param url String
 *
 * @returns string
 */
const trackingUrl = (url)=>{
    if(!url)return '';

    const localUrlObj = analysisUrl();  // 将 页面的 url search 后面的参数解析成 Object
    const targetUrlObj = analysisUrl(url);

    const tackingKeys = ['hmsr','inner'];  // 追踪码 key
    // utm 相关追踪码，以原链接的为主 'utm_source', 'utm_medium', 'utm_term', 'utm_content', 'utm_campaign',

    // 只选择追踪码
    let asignedObj = {};
    tackingKeys.forEach(item=>{
        if(localUrlObj[item]){
            asignedObj[item]=localUrlObj[item]
        }
    });

    if(asignedObj.hmsr){  // 获取页面地址的 hmsr
        targetUrlObj.hmsr = asignedObj.hmsr
    }

    const resultObj = {...asignedObj, ...targetUrlObj};

    url =  url.split('?')[0] || url;

    url = trackingHost(url);

    return assembling(url, resultObj);
};

// 获取cookie
function getCookie(name) {
    let nameValue = "";
    let key = "";
    let arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
    arr = document.cookie.match(reg);
    if (arr) {
        nameValue = decodeURI(arr[2]);
    }
    if (key != null && key != "") {
        reg = new RegExp("(^| |&)" + key + "=([^(;|&|=)]*)(&|$)");
        arr = nameValue.match(reg);
        if (arr) {
            return decodeURI(arr[2]);
        } else return "";
    } else {
        return nameValue;
    }
}

/**对比版本号
 *
 * 当前版本 大于 输入版本，返回true
 * 当前版本 小于 输入版本，返回false
 * 没有获取到版本号，返回false
 *
 * @param version
 * @returns {boolean}
 */

export function compareAppVersion(version) {
    let nowVersion = getCookie('HK-App-Version');
    if(!nowVersion) return true;  // 没有获取到版本号，可能是在浏览器中打开的

    if(nowVersion){
        const nowVersionArr = nowVersion.split('.')||[];
        const compareVersionArr = version.split('.')||[];
        if(nowVersionArr.length!=3 || compareVersionArr.length!=3){
            return false
        }

        if((Number(nowVersionArr[0])||0) < compareVersionArr[0] ){
            return false
        }
        if((Number(nowVersionArr[1])||0) < compareVersionArr[1] ){
            return false
        }
        if((Number(nowVersionArr[2])||0) < compareVersionArr[2] ){
            return false
        }
    }
    return true
}

const trackingHost = (url)=>{
    const windowHost =   window.location.host;
    if(!url)return '';

    if(windowHost.indexOf("hktqa")!=-1){ // qa 环境
        url = replaceStr(url,'hktqa');
    }else if( windowHost.indexOf("hktrd")!=-1){  // rd 环境
        url = replaceStr(url,'hktrd');
    }else if( windowHost.indexOf("hkdev")!=-1){ // dev 环境
        url = replaceStr(url,'hkdev');
    }

    return url
};

const replaceStr = (url,str)=>{
    url = url.replace(/https:\/\//,'http://');
    url = url.replace(/.com/,'.cn');
    url = url.replace(/homeking365/,str);
    return url
};

const  isEquipment=() => {
    let UA = navigator.userAgent,
        isAndroid = /android|adr|linux/gi.test(UA),
        isIOS = /iphone|ipod|ipad/gi.test(UA) && !isAndroid,
        isBlackBerry = /BlackBerry/i.test(UA),
        isWindowPhone = /IEMobile/i.test(UA),
        isMobile = isAndroid || isIOS || isBlackBerry || isWindowPhone;
    let nowVersion = getCookie('HK-App-Version')||false;
    return {
        isAndroid: isAndroid,
        isIOS: isIOS,
        isMobile: isMobile,
        isWeixin: /MicroMessenger/gi.test(UA),
        isQQ: /QQ/gi.test(UA),
        isPC: !isMobile,
        isWeibo: /WeiBo/gi.test(UA),
        isHKapp:nowVersion,
    }
};


/**
 * 判断页面是否到期：
 * 到期页面，则做引流到别的页面
 *
 * 1、页面设置开始日期，无设置结束日期，则默认在两个月后，页面引流到列表页面（页面开始日期默认为上线日期，除非特别指明）
 * 2、页面设置结束日期，在结束日期之后，引流到列表页面
 * 3、通过在页面增加 search 参数，关闭页面引流，查看历史页面
 * 4、可通过传参来设置引流的到达页面
 * 5、引流的页面默认增加相关追踪码
 */
const  setPageEnding=(obj)=> {
    const {noPageEnding, initStartTime, initEndTime} = analysisUrl();

    if(noPageEnding){  // 不需要设置页面引流，可控制过期页面重新打开
        return
    }

    let {startTime='', endTime='', endDay=60 ,pageEndUrl} = obj||{};

    if(initStartTime){
        startTime = initStartTime;
    }

    if(initEndTime){
        endTime = initEndTime;
    }

    console.log("在页面search后面添加 initStartTime 可设置初始时间");
    console.log("startTime:",startTime, "   endTime:",endTime);
    if(!endTime && !startTime){
        console.error("没有设置页面到期时间！");
        return
    }

    let isEnding = false;

    // 格式化时间
    startTime = startTime.replace(/-/g,"/");
    endTime = endTime.replace(/-/g,"/");
    startTime && (startTime = new Date(startTime).getTime());
    endTime && (endTime = new Date(endTime).getTime());

    const nowTime = new Date().getTime();
    if(endTime && nowTime > endTime){  // 已过 到期时间
        isEnding=true;
    }

    if(!endTime && startTime && ( nowTime > endDay*86400000+ startTime)){ // 无设置到期时间，但有设置默认时间，默认60天后到期
        isEnding=true;
    }

    if(!isEnding) return;

    // 页面引流
    let replaceUrl = pageEndUrl || "https://nurse.homeking365.com/page/nurseList";
    replaceUrl = trackingHost(
        assembling(replaceUrl,{Forward_Page:window.location.host})
    );
    window.location.replace(replaceUrl);

};

// 设置cookie
function setCookie(name, value) {
    let Days = 30;
    let exp = new Date();
    exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);

    let domain = ".homeking365.com";

    const windowHost = window.location.host;

    if (windowHost.indexOf("hktqa") != -1) { // qa 环境
        domain = ".hktqa.cn";
    } else if (windowHost.indexOf("hktrd") != -1) {  // rd 环境
        domain = ".hktrd.cn";
    } else if (windowHost.indexOf("hkdev") != -1) { // dev 环境
        domain = ".hkdev.cn";
    }

    document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString() + ";path=/;domain=" + domain;
}

/*
* 保姆一些公用的信息、方法到window.nurse
* */
export default {
    trackingHost,
    trackingUrl,
    analysisUrl,
    assembling,
    isEquipment,
    compareAppVersion,
    setPageEnding,
    equipment:isEquipment(),
    setCookie,
    getCookie,
};