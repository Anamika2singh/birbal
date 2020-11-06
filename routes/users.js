const express=require('express');
var router = express.Router();
var fs=require('fs')
 var mongoose = require('mongoose');
const  SignupModel = require('../model/signup');
// const  LoginModel = require('../model/login');
  const storemodel = require('../model/setupstore');
  const Product = require('../model/add_product');
  const categorymodel = require('../model/category');
    const submodel = require('../model/subcategory');
const multer = require('multer');
const bcrypt=require('bcrypt');
const saltRounds = 10;
const jwt=require('jsonwebtoken'); 
const middle =require('../middleware/authentication')
const { Validator } = require('node-input-validator');
const { update, populate, findOne } = require('../model/signup');

router.post('/signup',(req,res,next)=>{
    console.log(req.body);
    
   const   v = new Validator(req.body, {
       mobile_number : 'required|maxLength:10',
         password:'required'
                
   })
        v.check().then((matched) => {
                  if (!matched) {
                     res.status(422).send(v.errors);
                   }
                   else{
                       const mybodydata={
                           mobile_number : req.body.mobile_number, 
                           password: bcrypt.hashSync(req.body.password,saltRounds),
                           otp : Math.floor(1000+Math.random()*9000) 
                       }
                           var data = SignupModel(mybodydata);
                        data.save(function(err,Data){
                         if(err)
                              {
                               res.status(400).json({ 'message': 'not registered'})
                               }else{
                             console.log(Data.otp);
                                res.status(200).json({ 'message': 'registration successfull',data : Data})
                              }
               
                         });
                     }
                 });
        
});

router.post('/verify',(req,res,next)=>{    
   const   v = new Validator(req.body, {
    _id : 'required',
      otp:'required|maxLength:4'
             
      })
      v.check().then((matched) => {
        if (!matched) {
           res.status(422).send(v.errors);
         }
         else{
         SignupModel.findOne({'_id':req.body._id},(err,result)=>{
          if(err)
          res.status(400).json({'message':'this id user not registered'})
          else
          if(result.otp == req.body.otp){
            let token = jwt.sign(result.toJSON(),'KEY');
            let check = result.toJSON();
             check.token = token
            console.log(token);
          res.status(200).json({'message':'verified',result:check})
          }
          else{
            res.status(400).json({'message':'otp not matched'})
        }
    })
}
})
})


router.post('/login',(req,res,next)=>{
    console.log(req.body);
    const v = new Validator(req.body,{
        mobile_number : 'required|maxLength:10',
        password : 'required'
    })
    v.check().then((matched)=>{
        if (!matched) {
            res.status(422).send(v.errors);
          }
       else{
     var getData =SignupModel.findOne({'mobile_number':req.body.mobile_number},(err,user)=>{
        
         if(user==null) res.status(400).json({message:'invalid mobile no'})
         bcrypt.compare(req.body.password, user.password, (err, result) => {
             console.log(user.password);
             if (result == true) {
                  let token = jwt.sign(user.toJSON(),'KEY');
                 let check = user.toJSON();
                  check.token = token
              
                 res.status(200).json({message:"login suucessfully",result:check})
             } else {
                res.status(400).json({message:"Invalid password",result:{}})
             }
         })
    
     })
    }
})
})

router.post('/forgtepass',(req,res,next)=>{
       const v = new Validator(req.body,{
           mobile_number : 'required',
           new_password : 'required'
       })
       v.check().then((matched)=>{
             if (!matched) {
            res.status(422).send(v.errors);
                  }
        else{
                SignupModel.findOne({'mobile_number' :req.body.mobile_number},(err,data)=>{
                    if(data==null){
                        res.status(400).json({message : "no not registered"})}
                        else{
                            console.log(data)
                   SignupModel.updateOne( {mobile_number : req.body.mobile_number},
                    { $set:{password: bcrypt.hashSync(req.body.new_password,saltRounds)}},(err)=>{
                   if(err){ res.status(400).json({message : "can not update"})}
                   else{res.status(200).json({message :"updated"})}             
                    })
                        }
                })
         
    }
       })
 })

router.post('/home',middle,(req,res)=>{
// console.log(req.userData)
res.send("home page");
})

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './upload')
  },
  filename: function (req, file, cb) {
    cb(null,  Date.now()+file.originalname )
  }
})

const upload = multer({
  storage:storage
})


router.post('/store',upload.single('profile'),(req,res,next)=>{
    console.log(req.file);
    const   v = new Validator(req.body, {
      merchant_id  : 'required',
      business_name : 'required',
      business_type : 'required',
      description :  'required',
      mobile_number : 'required',
      whatsapp_support : 'required',
      business_email : 'required',
      store_address : 'required',
      city : 'required',
      state : 'required',
      nation : 'required',
      zip_code : 'required'
               
  })
    v.check().then((matched)=>{
      if (!matched) {
        res.status(422).send(v.errors);
    }
    else{
    const storedata = {
      merchant_id : req.body.merchant_id ,
         profile : req.file.path,
        business_name : req.body.business_name,
            business_type : req.body.business_type,
            description :  req.body.description,
            mobile_number : req.body.mobile_number,
            whatsapp_support : req.body.whatsapp_support,
            business_email : req.body. business_email,
            store_address : req.body.store_address,
            city :  req.body.city,
            state :  req.body.state,
            nation :  req.body.nation,
            zip_code :  req.body. zip_code
    
    }
     console.log(storedata)
    var data1 = storemodel(storedata);
     data1.save((err,data)=>{
      if(data==null){
        res.status(400).json({'message':'data not uploaded'})
      }
      else{
        res.status(200).json({'message' :'uploaded sucessfully ', result:data})
      }
    })
    }
})
})

    const product_array = [];
router.post('/newproduct',upload.array('pictures',7),(req,res)=>{
     console.log(req.body.store_id)
     const v = new Validator(req.body,{
       merchant_id : 'required',
      store_id : 'required',
      category_id : 'required',
      bar_code : 'required',
      MRP : 'required',
       product_name :'required',
      selling_price : 'required',
      piece : 'required',
      product_details : 'required',
      available : 'required',
     add_size_color :'required',
     choose_size :'required',
      choose_color :'required'
    })
    v.check().then((matched)=>{
      if (!matched) {
     res.status(422).send(v.errors);
           }
      else{
      req.files.forEach(element => {
        product_array.push(element.path) 
      });  
     Product.create({pictures:product_array,
      merchant_id : req.body.merchant_id,
      store_id:req.body.store_id,
       category_id : req.body.category_id,
       bar_code :  req.body.bar_code,                  
       product_name : req.body.product_name,
       MRP : req.body.MRP,
       selling_price : req.body.selling_price,
       piece : req.body.piece,
       product_details : req.body.product_details,
       available : req.body.available,
      add_size_color :req.body.add_size_color,
      choose_size : req.body.choose_size,
      choose_color :req.body.choose_color})
       .then(user=>{res.status(200).json({message : "added new product",result : user})})
       .catch(err=>{console.log(err=>{console.log(err)})
         })
        }
   })
})
router.post('/edit_store',upload.single('profile'),(req,res,next)=>{
  console.log(req.file)
  console.log(req.body)
  const v = new Validator(req.body,{
    store_id : 'required'
  })
  v.check().then((matched)=>{
    if(!matched){
    res.status(422).send(v.errors)
    }
    else{
      storemodel.findByIdAndUpdate({'_id' : req.body.store_id},{profile : req.file.path , 
        business_name :req.body.business_name,
      business_type :req.body.business_type,
      description :  req.body.description,
     mobile_number :req.body.mobile_number,
      whatsapp_support : req.body.whatsapp_support,
      business_email : req.body.business_email,
      store_address : req.body.store_address,
      city : req.body.city,
     state : req.body.state,
      nation : req.body.nation,
      zip_code : req.body.zip_code}
      ,(err,result)=>{
        if(err){
        res.status(400).json({message :'cannot update'})
        }
        else{
          res.status(200).json({message : 'updated',check:result })
        }
      })
    }
    })
    
  })

  router.post('/edit_product',(req,res,next)=>{

    console.log(req.body)
    const v = new Validator(req.body ,{
      product_id : 'required'
    })
    v.check().then((matched)=>{
      if(!matched){
      res.status(422).send(v.errors)
      }
      else{
        
    Product.findByIdAndUpdate({'_id' : req.body.product_id },
    {
       store_id:req.body.store_id,
       category_id : req.body.category_id,
       bar_code :  req.body.bar_code,                  
       product_name : req.body.product_name,
       MRP : req.body.MRP,
       selling_price : req.body.selling_price,
       piece : req.body.piece,
       product_details : req.body.product_details,
       available : req.body.available,
      add_size_color :req.body.add_size_color,
      choose_size : req.body.choose_size,
      choose_color :req.body.choose_color},
    (err,result)=>{
      if(err){
        res.status(400).json({'message' : 'cannot update'})
    }
      else{
  console.log(req.file)
    res.status(200).json({'message' : 'updated' ,result : result})
      }
   })
  }
})
  })
router.post('/addcategory',(req,res,next)=>{
  console.log(req.body)
 
  const v = new Validator(req.body,{
    category_name : 'required'
   })
   v.check().then((matched)=>{
    if (!matched) {
        res.status(422).send(v.errors);
      }
   else{
    categorymodel.findOne({'category_name':req.body.category_name},(err,result)=>{
      if(result == null){
              categorymodel.create({category_name : req.body.category_name})
             .then(user=>{res.status(200).json({'message':'added' , user:user})})
            .catch(err=>{console.log(err)})
      }
      else{
        res.status(400).json({'message' : 'already added'})
      }
    })
  }
})
})
router.post('/subcategory',(req,res,next)=>{
  console.log(req.body);
  const v = new Validator(req.body,{
    category_id : 'required',
    subname : 'required'
   })
   v.check().then((matched)=>{
     if(!matched){
     res.status(422).send(v.errors)
     }
     else{
       submodel.create({category_id : req.body.category_id ,subname : req.body.subname})
     .then(user=>{res.status(200).json({message : "added subcategory",result : user})})
     .catch(err=>{console.log(err)})
    }
   })
})
router.post('/catalog',middle,async(req,res,next)=>{
  
   let products = await Product.aggregate([
         { $match : {merchant_id :mongoose.Types.ObjectId(req.body.merchant_id)}},
     {$group: {
       _id : "$category_id"}}
   ])
     console.log(products)             
   let catgids = products.map(arr=>arr['_id'])
         console.log(catgids)
    let catalog_array = [];
  
    for(id of catgids)
    {
      let category = await categorymodel.findOne({'_id':id},{category_name : 1,_id : 1})
      console.log(category)
      if(category){
        let proinfo = await Product.find({'category_id':id ,'merchant_id':req.body.merchant_id},{product_name :1,_id :0})
         console.log(proinfo) 
         
             catalog_array.push({
                 category_name:category.category_name,
                 product_name :proinfo
                           })
      }
    }
     console.log(catalog_array)
     res.status(200).json({ catalog_array : catalog_array})
})
router.post('/product_details',(req,res,next)=>{
     
  // Product.findOne({'id':mongoose.Types.ObjectId(req.body.product_id)})
  // .populate('category_id')
  // .exec((err,user)=>{
  //   console.log(user)
  // })
   Product.aggregate([{ $match : {'_id':mongoose.Types.ObjectId(req.body.product_id)}},
   {$lookup:{from :"categories",localField :"category_id" ,foreignField : "_id",as : "category_details"}},
    
   {$lookup:{from :"subcates",localField :"category_id" ,foreignField : "category_id", as : "subcategory_details"}},
   {$project  : {
     
    'product_name':1,
    'MRP' : 1,
    'selling_price' :1,
    'add_size_color' : 1,
    'choose_size' :1,
    'choose_color':1,

    'catogry_name':"$category_details.category_name",
    'sub_catogry_name':"$subcategory_details.subname"
  
  }},
   
   ]).exec((err,user)=>{
       console.log(user)
       res.send(user)
     })

  
})
router.post('/picture_edit/:id',(req,res,next)=>{
    // Product.findOne({'_id' : req.body.product_id,'pictures' : req.params.id},(err,result)=>{
    //     console.log(result)
        
    // }) 
   let dir = './upload'
   //console.log(dir)
   // console.log(req.params.id)
    var path=dir+'/'+req.params.id+'.png'
    console.log(path)
    try{
      fs.unlinkSync(dir+'/'+req.params.id+'.png')
      res.send('deleted')
    }
    catch(e){
      return res.status(400).send(e);
    }
    
})
module.exports = router; 