/*!
* 主  题：API调用方法
* 说  明：用于调用Restful api接口的js方法。
* 功能描述：
* 1、封装api调用方法，采用axios异步读取服务端；支持get,post,delete,put,patch,options六种方式
* 2、数据提交与返回均经过url编码与解码
* 3、一些常用方法，如$api.trim，querystring,cookies等
*
*
* 作  者：宋雷鸣 10522779@qq.com
* 开发时间: 2019年5月20日
*/
(function () {
    var config = {
        //api的版本号
        versions: ["", "1", "2"],
        versionDefault: "1",    //默认版本号
        //调用地址的根路径
        baseURL: '',
        pathUrl: "/api/v{0}/",  //url路径
    };
    //版权信息
    var copyright = {};
    //一些常用方法
    var methods = {
        //生成axios调用的路径,
        //vesion:api版本号,
        //way:api方法名，如/api/v1/[account/del]
        url: function (version, way) {
            if (way === undefined) throw 'api名称不得为空';
            var url = config.pathUrl.replace("{0}", version);
            //调用地址的根路径可以在此处理，（如果需要跨多台服务器请求的话）
            if (config.baseURL != '') url = config.baseURL + url;
            return url + way;
        },
        //获取url中的参数
        querystring: function (url, key) {
            if (arguments.length == 1) {
                key = arguments[0];
                url = String(window.document.location.href);
            }
            var value = "";
            if (url.indexOf("?") > -1) {
                var ques = url.substring(url.lastIndexOf("?") + 1);
                var tm = ques.split('&');
                for (var i = 0; i < tm.length; i++) {
                    var arr = tm[i].split('=');
                    if (arr.length < 2) continue;
                    if (key.toLowerCase() == arr[0].toLowerCase()) {
                        value = arr[1];
                        break;
                    }
                }
            }
            if (value.indexOf("#") > -1) value = value.substring(0, value.indexOf("#"));
            value = decodeURI(value).replace(/<[^>]+>/g, "");
            return value;
        },
        //去除两端空格
        trim: function (str) {
            return str.replace(/^\s*|\s*$/g, '');
        },
        //将数据url解码
        unescape: function (data) {
            var typeName = methods.getType(data);
            if (typeName == 'String') return unescape(data);
            if (typeName == 'Object') return handleObject(data);
            if (typeName == 'Array') return handleArray(data);
            //反常时间的处理，如果时间处于一百年前，则返回空值
            function abnormalTime(date) {
                var now = new Date();
                var y = now.getFullYear();
                var m = now.getMonth();
                var d = now.getDate();
                now = new Date(y - 100, m < 10 ? '0' + m : m, d < 10 ? ('0' + d) : d);
                if (date > now) return date;
                return '';
            }
            //解码对象
            function handleObject(data) {
                for (var key in data) {
                    var typeName = methods.getType(data[key]);
                    if (typeName == 'String')
                        data[key] = unescape(data[key]);
                    if (typeName == 'Date')
                        data[key] = abnormalTime(data[key]);
                    if (typeName == 'Array')
                        data[key] = handleArray(data[key]);
                }
                return data;
            }
            //解码数组
            function handleArray(data) {
                for (var d in data) {
                    data[d] = handleObject(data[d]);
                }
                return data;
            }
            return data;
        },
        //判断数据类型
        getType: function (data) {
            var getType = Object.prototype.toString;
            var myType = getType.call(data);//调用call方法判断类型，结果返回形如[object Function]  
            var typeName = myType.slice(8, -1);//[object Function],即取除了“[object ”的字符串。 
            return typeName;
        },
        //storage存储
        storage: function (key, value) {
            var isAndroid = (/android/gi).test(navigator.appVersion);
            var uzStorage = function () {
                var ls = window.localStorage;
                if (isAndroid) {
                    ls = window.localStorage;
                }
                return ls;
            };
            //如果只有一个参数，为读取
            if (arguments.length === 1) {
                var ls = uzStorage();
                if (ls) {
                    var v = ls.getItem(key);
                    if (!v) { return; }
                    if (v.indexOf('obj-') === 0) {
                        v = v.slice(4);
                        return JSON.parse(v);
                    } else if (v.indexOf('str-') === 0) {
                        return v.slice(4);
                    }
                }
            }
            //如果两个参数，为写入，第一个为键，第二个为值
            if (arguments.length === 2) {
                if (value != null) {
                    var v = value;
                    if (typeof v == 'object') {
                        v = JSON.stringify(v);
                        v = 'obj-' + v;
                    } else {
                        v = 'str-' + v;
                    }
                    var ls = uzStorage();
                    if (ls) {
                        ls.setItem(key, v);
                    }
                } else {
                    var ls = uzStorage();
                    if (ls && key) {
                        ls.removeItem(key);
                    }
                }
            }
        },
        cookie: function (name, value, options) {
            if (typeof value != 'undefined') { // name and value given, set cookie 
                options = options || {};
                if (value === null) {
                    value = '';
                    options.expires = -1;
                }
                var expires = '';
                if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
                    var date;
                    if (typeof options.expires == 'number') {
                        date = new Date();
                        date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
                    } else {
                        date = options.expires;
                    }
                    expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE 
                }
                var path = options.path ? '; path=' + options.path : '; path=/';
                var domain = options.domain ? '; domain=' + options.domain : '';
                var secure = options.secure ? '; secure' : '';
                document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
            } else { // only name given, get cookie 
                var cookieValue = null;
                if (document.cookie && document.cookie != '') {
                    var cookies = document.cookie.split(';');
                    for (var i = 0; i < cookies.length; i++) {
                        var cookie = jQuery.trim(cookies[i]);
                        // Does this cookie string begin with the name we want? 
                        if (cookie.substring(0, name.length + 1) == (name + '=')) {
                            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                            break;
                        }
                    }
                }
                return cookieValue;
            }
        }
    };
    //api操作的具体对象和方法
    var apiObj = function (version) {
        //加载效果，参数：前者为一般loading效果，后者一般为去除loading
        this.effect = function (loading, loaded) {
            this.loadeffect.before = loading;
            this.loadeffect.after = loaded;
            return this;
        }
        this.loadeffect = { before: null, after: null };
        //当前api要请求的服务端接口的版本号
        this.version = version == null ? config.versionDefault : version;
        var httpverb = ['get', 'post', 'delete', 'put', 'patch', 'options'];
        for (let i = 0; i < httpverb.length; i++) {
            var el = httpverb[i];
            eval("this." + el + " = function (way, parameters,loading,loaded) {return this.query(way, parameters, '" + el + "',loading,loaded);};");
        }
        var self = this;
        //创建请求对象，以及拦截器
        this.query = function (way, parameters, method, loading, loaded) {
            if (method != 'get') method = 'post';
            var url = methods.url(this.version, way);
            if (arguments.length < 2 || parameters == null) parameters = {};
            if (arguments.length < 3 || method == null || method == '') method = 'get';
            //创建axiso对象
            var instance = axios.create({
                method: method, url: url,
                headers: {
                    'X-Custom-Header': 'weishakeji',
                    'Access-Control-Allow-Headers': 'X-Requested-With',
                    'content-type': 'application/x-www-form-urlencoded',
                    'Access-Control-Allow-Methods': 'POST,GET,DELETE,PUT,PATCH,HEAD,OPTIONS'
                },
                auth: {
                    username: window.location.href,
                    password: 'weishakeji'
                  },
                timeout: 60 * 1000
            });
            //添加请求拦截器（即请求之前）
            instance.interceptors.request.use(function (config) {
                if (loading == null) loading = self.loadeffect.before;
                if (loading != null) loading(config);
                //在发送请求之前做某件事
                if (config.method != 'get') {
                    var formData = new FormData();
                    for (var d in config.data) {
                        var typeName = methods.getType(config.data[d]);
                        if (typeName == 'Date') {
                            formData.append(d, config.data[d].getTime());
                        } else {
                            formData.append(d, escape(config.data[d]));
                        }
                    }
                    config.data = formData;
                } else {
                    //克隆参数对象，因为上传的参数要escape转码，需要保留原数据类型
                    var tmpObj = new Object();
                    for (var d in config.params) {
                        var typeName = methods.getType(config.params[d]);
                        if (typeName == 'Date') {
                            tmpObj[d] = config.params[d].getTime();
                        } else {
                            tmpObj[d] = escape(config.params[d]);
                        }
                    }
                    config.params = tmpObj;
                }
                return config;
            }, function (error) {
                console.log('错误的传参');
                if (loaded == null) loaded = self.loadeffect.after;
                if (loading != null) loaded(config, error);
                //return Promise.reject(error);
            });
            //添加响应拦截器（即返回之后）
            instance.interceptors.response.use(function (response) {
                //如果返回的数据是字符串，这里转为json
                if (typeof (response.data) == 'string') {
                    response.data = eval("(" + response.data + ")");
                }
                //处理数据，服务器端返回的数据是经过Url编码的，此处进行解码
                if (response.data.result != null) {
                    if (typeof (response.data.result) == 'string') {
                        //response.data.result = eval("(" + response.data.result + ")");
                    }
                    response.data.result = methods.unescape(response.data.result);
                }
                //执行加载完成后的方法
                if (loaded == null) loaded = self.loadeffect.after;
                if (loaded != null) loaded(response, null);
                return response;
            }, function (error) {
                if (loaded == null) loaded = self.loadeffect.after;
                if (loaded != null) loaded(null, error);
                //return Promise.reject(error);
            });
            //如果是get方式，参数名是params；非get参数名是data
            if (method == 'get') {
                return instance.request({ params: parameters });
            } else {
                return instance.request({ data: parameters });
            }
        }
        //常用方法加到$api根，方便调用
        for (var m in methods) {
            eval("this." + m + "=" + methods[m] + ";");
        }
    };
    //创建$api调用对象
    for (var v in config.versions) {
        var str = config.versions[v] == "" ?
            "window.$api = new apiObj();" :
            "window.$api.v" + config.versions[v] + "= new apiObj('" + config.versions[v] + "')";
        eval(str);
    }
})();
//$api.get("/dd/xx");
//$api.v1.post();
//$api.v2.delete();
//var t=$api.cookie("localhost_ExamAcc");
//alert(t);