var api={
name:"api"
};
var config= require('../config.js');
var aes128 = require('../libs/aes128.js');
var check = require('../libs/check.js');
var conn = require('../mysql.js');
var services = require('../libs/system.js');
var datas = require('../libs/datas.js');
var request = require('request');
var libs = require('../libs/libs.js');
var common =require('../libs/common.js');
api.apiPermission = function(req,res,next){
    //console.log('permission');
    res.setHeader('content-type','application/json; charset=UTF-8');
    var id = req.query.appId;
    console.log(id);
    //根据appid读取app权限信息
    services.app_permission_model.findOne({appid:id},function(err,app_permission){
        console.log(err,app_permission);

        if(err){
            console.log(err);
            res.dump('redisError');
            return;
        }
        if(app_permission==null){
            res.dump('appIdError');
        }else{
            //判断appkey是否正确
            var key = req.query.appSecret;
            if(key!=app_permission.appkey){
                res.dump('appKeyError');
            }else{
                //console.log(req.params);
                //console.log(req.params[0]);
                var func = req.params[0];
                //判断app是否有权限调用当前接口
                if(app_permission.p_list.indexOf(func)==-1){
                    res.dump('appPermissionError');
                }else{
                    next();
                }

            }
        }
    });
};

/**
 * 手动更新
 * @param req
 * @param res
 */
api.update = function(req,res){

    if(!req.query.type){
        res.dump('lackParamsType');
        return;
    }

    switch(req.query.type){

        case 'score':
            req.query.field = 'score';

            check.student(req.query,function(e,r){
        if(e){
            res.end(JSON.stringify(e));
            return;
        }

                    request(config.queryUrl+'/?name=score&opt=put&data={"studentId":' + req.query.studentId + ',"password":"' + r.password + '","appId":'+req.query.appId+'}', function (eee, rrr) {

                            if (eee) {
                                res.dump('requestError');
                                console.log(eee);
                                return;
                            }
                            res.dump('scoreUpdateQuerySuccess');
                            return;
                        }
                    );
    });


            break;

        case 'major':
            req.query.field = 'major';
            check.student(req.query,function(e,r){
                if(e){
                    res.end(JSON.stringify(e));
                    return;
                }
                            request(config.queryUrl+'/?name=major&opt=put&data={"studentId":' + req.query.studentId + ',"password":"' + r.password + '","appId":'+req.query.appId+'}', function (eee) {

                                    if (eee) {
                                        res.dump('requestError');
                                        console.log(eee);
                                        return;
                                    }
                                    res.dump('majorUpdateQuerySuccess');
                                    return;
                                }
                            );


            });

            break;
        case 'book':
            req.query.field = 'book';
            check.library(req.query,function(e,r){
                if(e){
                    res.end(JSON.stringify(e));
                    return;
                }

                            request(config.queryUrl+'/?name=book&opt=put&data={"studentId":"' + req.query.studentId + '","password":"' + r.password + '","appId":'+req.query.appId+'}', function (eee) {

                                    if (eee) {
                                        res.dump('requestError');
                                        console.log(eee);
                                        return;
                                    }
                                    res.dump('libraryUpdateQuerySuccess');
                                    return;
                                }
                            );


            });
            break;


        case 'exam':
            req.query.field = 'exam';
            check.student(req.query,function(e,r){
                if(e){
                    res.end(JSON.stringify(e));
                    return;
                }
                request(config.queryUrl+'/?name=exam&opt=put&data={"studentId":' + req.query.studentId + ',"password":"' + r.password + '","appId":'+req.query.appId+'}', function (eee) {

                        if (eee) {
                            res.dump('requestError');
                            console.log(eee);
                            return;
                        }
                        res.dump('examUpdateQuerySuccess');
                        return;
                    }
                );


            });

            break;

        default:
            res.dump('paramsError');
            break;
    }
};

//输出成绩
api.score = function(req,res){
req.query.field = 'score';
check.student(req.query,function(e,r){
   if(e){
       res.end(JSON.stringify(e));
       return;
   }
    console.log("select termId,courseId,orderId,propertyId,credit,score,name,EnglishName,reason from scu_score where studentId="+ req.query.studentId+" and version="+ r.scoreVersion);
    conn.query(
        {
            sql:"select termId,courseId,orderId,propertyId,credit,score,name,EnglishName,reason from scu_score where studentId="+ req.query.studentId+" and version="+ r.scoreVersion+" order by id desc"
        },function(ee,rr){
            if(ee){
                res.dump('mysqlError');
               return;
            }
            //console.log(rr);
            //console.log(datas.propertyById);

            if(rr.length>0) {

                var scores = [];
                for (var i = 0; i < rr.length; i++) {
                    scores[i] = {
                        term: datas.termById[rr[i].termId].name,
                        current:datas.currentTerm.termId==rr[i].termId?1:0,
                        courseId:rr[i].courseId,
                        orderId:rr[i].orderId,
                        property:datas.propertyById[rr[i].propertyId]?datas.propertyById[rr[i].propertyId].name:"未知",
                        credit:rr[i].credit,
                        score:rr[i].score,
                        name:rr[i].name,
                        EnglishName:rr[i].EnglishName,
                        reason:rr[i].reason
                    }

                }

                res.dump('ok',{
                    count: r.scoreCount,
                    updateAt: r.scoreUpdateAt,
                    version: r.scoreVersion,
                    scores:scores

                });
            }else{

                if(r.scoreVersion > 0){
                    res.dump('ok',{
                        count: r.scoreCount,
                        updateAt: r.scoreUpdateAt,
                        version: r.scoreVersion,
                        scores:[]

                    });
                    return;
                }

                request(config.queryUrl+'/?name=score&opt=put&data={"studentId":' + req.query.studentId + ',"password":"' + r.password + '","appId":'+req.query.appId+'}', function (eee, rrr) {

                        if (eee) {
                            res.dump('requestError');
                            console.log(eee);
                            return;
                        }
                        res.dump('scoreInitQuerySuccess');
                        return;
                    }
                );
            }
        }
    )

});

};

api.exam = function(req,res){

    req.query.field = 'exam';
    check.student(req.query,function(e,r){
        if(e){
            res.end(JSON.stringify(e));
            return;
        }
        //console.log(r);

        conn.query(
            {
                sql:"select * from scu_exam where studentId="+ req.query.studentId+" and version="+ r.examVersion
            },function(ee,rr){

                if(ee){
                    res.dump('mysqlError');
                    return;
                }
                console.log(rr);
                
                //console.log(datas.termById);
                if(rr.length>0) {
                    var list = [];
                    for (var i = 0; i < rr.length; i++) {
                        //console.log(datas.termById[rr[i].termId]);
                        list[i] = {
                            term: datas.termById[rr[i].termId].name,
                            examName:rr[i].examName,
                            start:rr[i].start,
                            end:rr[i].end,
                            credit:rr[i].credit,
                            name:rr[i].name,
                            campus:datas.campusById[rr[i].campusId].name,
                            week:rr[i].week,
                            building:rr[i].building,
                            classroom:rr[i].classroom,
                        }

                    }
                    console.log(r);

                    res.dump('ok',{
                        currentWeek:(parseInt((common.todayStartTimestamp()-datas.firstDay[datas.currentTerm.termId])/3600/24/7)+1),
                        count: r.examCount,
                        updateAt: r.examUpdateAt,
                        version: r.examVersion,
                        exams:list

                    });
                }else{
                    if(r.examVersion > 0){
                        res.dump('ok',{
                            count: r.examCount,
                            updateAt: r.examUpdateAt,
                            version: r.examVersion,
                            exams:[]
                        });
                        return;
                    }



                    request(config.queryUrl+'/?name=exam&opt=put&data={"studentId":' + req.query.studentId + ',"password":"' + r.password + '","appId":"'+req.query.appId+'"}', function (eee) {

                            if (eee) {
                                res.dump('requestError');
                                console.log(eee);
                                return;
                            }
                            res.dump('examInitQuerySuccess');
                            return;
                        }
                    );
                    //加入生产者

                }
            }
        )

    });
}


//输出课表
api.major = function(req,res){
req.query.field = 'major';
    check.student(req.query,function(e,r){
        if(e){
            res.end(JSON.stringify(e));
            return;
        }
        //console.log(r);

        conn.query(
            {
                sql:"select * from scu_major where studentId="+ req.query.studentId+" and version="+ r.majorVersion
            },function(ee,rr){

                if(ee){
                    res.dump('mysqlError');
                    return;
                }
                //console.log(rr);

                if(rr.length>0) {

                    var list = [];
                    for (var i = 0; i < rr.length; i++) {
                        list[i] = {
                            term: datas.termById[rr[i].termId].name,
                            courseId:rr[i].courseId,
                            orderId:rr[i].orderId,
                            property:rr[i].propertyId?datas.propertyById[rr[i].propertyId].name:"",
                            credit:rr[i].credit,
                            name:rr[i].name,
                            teacherName:rr[i].teacherName,
                            week:rr[i].week,
                            weekHasLesson:rr[i].weekHasLesson,
                            lesson:rr[i].lesson,
                            building:rr[i].building,
                            classroom:rr[i].classroom,
                            status:rr[i].status
                        }

                    }
                    console.log(r);

                    res.dump('ok',{
                        currentWeek:(parseInt((common.todayStartTimestamp()-datas.firstDay[datas.currentTerm.termId])/3600/24/7)+1),
                        count: r.majorCount,
                        updateAt: r.majorUpdateAt,
                        version: r.majorVersion,
                        majors:list

                    });
                }else{

                    if(r.majorVersion > 0){
                        res.dump('ok',{
                            count: r.majorCount,
                            updateAt: r.majorUpdateAt,
                            version: r.majorVersion,
                            majors:[]
                        });
                        return;
                    }



                    request(config.queryUrl+'/?name=major&opt=put&data={"studentId":' + req.query.studentId + ',"password":"' + r.password + '","appId":'+req.query.appId+'}', function (eee) {

                            if (eee) {
                                res.dump('requestError');
                                console.log(eee);
                                return;
                            }
                            res.dump('majorInitQuerySuccess');
                            return;
                        }
                    );
                    //加入生产者

                }
            }
        )

    });

};


//输出我的图书列表
api.book = function(req,res){
    req.query.field = 'book';
    check.library(req.query,function(e,r){
        if(e){
            res.end(JSON.stringify(e));
            return;
        }
        console.log(r);
//console.log("select * from scu_book where studentId='"+ req.query.studentId+"' and version="+ r.version);
        conn.query(
            {
                sql:"select * from scu_book where studentId="+ req.query.studentId+" and version="+ r.version
            },function(ee,rr){
                if(ee){
                    console.log(ee);
                    res.dump('mysqlError');
                    return;
                }
                console.log(rr);

                if(rr.length>0) {

                    var list = [];
                    var location={
                        'J':"江安馆",
                        'W':"文理馆",
                        'Y':"医学馆",
                        'G':"工学馆"


                    };
                    for (var i = 0; i < rr.length; i++) {
                        list[i] = {
                            name:rr[i].name,
                            deadline:rr[i].deadline,
                            author:rr[i].author,
                            location:location[rr[i].location.substr(0,1)]?location[rr[i].location.substr(0,1)]:"图书馆",
                            index:rr[i].index,
                            xc:rr[i].xc,
                            barcode:rr[i].barcode,
                            borId:rr[i].borId

                        }

                    }

                    res.dump('ok',{
                        count: r.count,
                        updateAt: r.updateAt,
                        version: r.version,
                        books:list

                    });
                }else{


                    if(r.version > 0){
                        res.dump('ok',{
                            count: r.count,
                            updateAt: r.updateAt,
                            version: r.version,
                            books:[]
                        });
                        return;
                    }



                    request(config.queryUrl+'/?name=book&opt=put&data={"studentId":"' + req.query.studentId + '","password":"' + r.password + '","appId":'+req.query.appId+'}', function (eee) {

                            if (eee) {
                                res.dump('requestError');
                                console.log(eee);
                                return;
                            }
                            res.dump('libraryInitQuerySuccess');
                            return;
                        }
                    );
                    //加入生产者

                }
            }
        )

    });

};


/**
 *续借图书
 * @type {{name: string}}
 */

api.renew = function(req,res){
    check.renew(req.query,function(e,r){

        if(e){
            console.log(e);
            res.end(JSON.stringify(e));
            return;
        }
        request(config.queryUrl+'/?name=renew&opt=put&data={"studentId":"' + req.query.studentId + '","password":"' + r.password + '","xc":'+ req.query.xc+',"barcode":"'+ req.query.barcode+'","borId":"'+ req.query.borId+'","appId":'+req.query.appId+'}', function (eee, rrr) {
                if (eee) {
                    res.dump('requestLibError');
                    console.log(eee);
                    return;
                }
                res.end(JSON.stringify({
                    code:200,
                    message:"续借操作提交成功，请勿重复提交"
                }))
                return;
            }
        );



    });

};



module.exports = api;