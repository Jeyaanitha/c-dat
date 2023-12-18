const awsController = require("../controller/awsController")
const router=require("express").Router();

router.post("/vpc",awsController.static_vpc)
router.post("/login",awsController.aws_login)
router.get("/vpclist",awsController.vpc_list);
router.post("/ec2_instance",awsController.ec2_instance) 
router.get("/SG_list",awsController.security_group_list)
router.get("/subnet_list",awsController.subnet_list)
router.post("/s3_bucket",awsController.s3_bucket)
router.delete("/delete",awsController.destroy)
router.post("/queue_creation", awsController.create_queue)
router.post("/sns_topic", awsController.create_sns_topic)
 router.get("/code_pull", awsController.code_pull)
router.post("/code_push", awsController.push_code)
router.get("/os_list",awsController.os_list)
router.post("/aws/vpc",awsController.vpc_archi)
//router.post("/dynamic/vpc",awsController.dynamic_vpc)
router.post("/launch_template",awsController.launch_template)
router.post("/ami_instance",awsController.ami_instance)
router.post("/asg",awsController.ASG)


router.post("/aws_vpc",awsController.aws_vpc)
router.post("/pub_subnet",awsController.aws_pub_subnet)
router.post("/pvt_subnet",awsController.aws_pvt_subnet)
router.post("/internet_gateway",awsController.internet_gateway)
router.post("/route_table_pub",awsController.route_table_pub)
router.post("/pub_security_group",awsController.pub_security_group)
router.post("/pvt_security_group",awsController.pvt_security_group)
router.post("/route_table_pvt",awsController.route_table_pvt)
router.post("/pub_subnet_asso",awsController.pub_subnet_association)
router.post("/pvt_subnet_asso",awsController.pvt_subnet_association)
// router.post("/jenkin",awsController.jenkin)
router.post("/architecture",awsController.architecture)
router.post("/rosa",awsController.rosa)

module.exports=router