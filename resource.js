const tfConfig='';

function vpc(value) {
  let data = JSON.parse(value);

    const vpcResources =  data.map((vpc, index) => `
        resource "aws_vpc" "${vpc.vpc_tag}_${index}" {
          cidr_block       = "${vpc.vpc_cidr}"
          instance_tenancy = "default"
          tags = {
            Name = "${vpc.vpc_tag}"
          }
        }

        output "${vpc.vpc_tag}" {
            value = aws_vpc.${vpc.vpc_tag}.id
          }
      `)
      .join('');
      return vpcResources;
  }

  function subnet(value) {
    let data = JSON.parse(value);
    
    let subnetResources = data.map(subnet => `
        resource "aws_subnet" "${subnet.tag}" {
          vpc_id                  = aws_vpc.${subnet.tag}.id
          cidr_block              = "${subnet.cidr}"
          availability_zone       = "${subnet.az}"
          map_public_ip_on_launch = true
          tags = {
            Name = "${subnet.tag}"
          }
    
          route_table_association {
            subnet_id      = aws_subnet.${subnet.tag}.id
            route_table_id = aws_route_table.${subnet.rt}.id
          }
        }
    
        output "${subnet.tag}" {
          value = aws_subnet.${subnet.tag}.id
        }
      `
    ).join('\n');
    
    console.log("subnetResources is : ", subnetResources);
    ;
      return subnetResources;
  }


  function internet_gateway(value){
    let data = JSON.parse(value);
    const igResources = data
    .map((internet_gateway,index ) =>`
    resource "aws_internet_gateway" "${internet_gateway.igw_tag}" {
        vpc_id = aws_vpc.${internet_gateway.vpc_tag}.id
        tags = {
          Name = "${internet_gateway.igw_tag}"
        }
      }
      output "${internet_gateway.igw_tag}" {
        value = aws_vpc.${internet_gateway.igw_tag}.id
      }
     `)
     .join('');

    return igResources;
  }

  function public_route_table(value){
    let data = JSON.parse(value);
    const prtResources = data.map((public_route_table,index)=> 
     `resource "aws_route_table" "${public_route_table.pub_rt_tag}" {
        vpc_id = aws_vpc.${public_route_table.vpc_tag}.id
        route {
          cidr_block = "0.0.0.0/0"
          gateway_id = aws_internet_gateway.${public_route_table.igw_tag}.id
        }
       
        tags = {
          Name = "${public_route_table.pub_rt_tag}"
        }
      }
      output "${public_route_table.pub_rt_tag}" {
        value = aws_vpc.${public_route_table.pub_rt_tag}.id
      }
      `)
      .join('');

      return prtResources;
  }

  function private_route_table(value){
    let data = JSON.parse(value);
    const pvtRtResources = data.map((private_route_table,index)=>
    `resource "aws_route_table" "${private_route_table.pvt_rt_tag}" {
        vpc_id = aws_vpc.${private_route_table.vpc_tag}.id
        tags = {
          Name = "${private_route_table.pvt_rt_tag}"
        }
      }
      
      output "${private_route_table.pvt_rt_tag}" {
        value = aws_vpc.${private_route_table.pvt_rt_tag}.id
      }`)
      .join('');

      return pvtRtResources;
  }

  function security_group(value){
    let data = JSON.parse(value);
    const sgResources = data.map((security_group,index) =>
    `resource "aws_security_group" "${security_group.tag}" {
        name        = "${security_group.tag}"
        description = "Allow inbound traffic"
        vpc_id      = ${security_group.vpc_id}
        ${generateSecurityGroupIngressRules(security_group.protocol)}
        egress {
            from_port        = 0
            to_port          = 0
            protocol         = "-1"
            cidr_blocks      = ["0.0.0.0/0"]
            ipv6_cidr_blocks = ["::/0"]
        }

        tags = {
            Name = "${security_group.tag}"
        }
    }

    output "vpc_id_${security_group.tag}" {
        value = aws_vpc.${security_group.tag}.id
      }
`).join('')
}

const generateSecurityGroupIngressRules = (protocols) => {
    return protocols.map(protocol => `
        ingress {
            from_port   = ${protocol === "SSH" ? 22 : protocol === "HTTP" ? 80 : protocol === "HTTPS" ? 443 : 0}
            to_port     = ${protocol === "SSH" ? 22 : protocol === "HTTP" ? 80 : protocol === "HTTPS" ? 443 : 0 }
            protocol    = "tcp"
            cidr_blocks = ["0.0.0.0/0"]
            ipv6_cidr_blocks = ["::/0"]
        }
    `).join('');
};
function myFunction(value) {
    let result;
  
    switch (value) {
        case 'Amazon Linux 2023 kernel-6.1':
            result = "ami-02a2af70a66af6dfb";
            break;
        case 'Amazon Linux 2 Kernel-5.10':
            result = "ami-0d92749d46e71c34c";
            break;
        case 'Ubuntu focal 20.04 LTS':
            result = "ami-0a7cf821b91bcccbc";
            break;
        case 'Ubuntu jammy 22.04 LTS':
            result = "ami-0287a05f0ef0e9d9a";
            break;
        case 'Windows server core base-2022':
            result = "ami-08ac34653a1e1b4b9";
            break;
        case 'Windows server core base-2019':
            result = "ami-0b33299742a1b79e0";
            break;
        case 'Windows server core base-2016':
            result = "ami-06d692ce72530031b";
            break;
        case 'Windows with SQL server-2022 Standard':
            result = "ami-0798b918496671569";
            break;
        case 'Red Had Enterprise Linux 9':
            result = "ami-0645cf88151eb2007";
            break;
        default:
            result = 'Value is not recognized';
    }
  
    return result;
  }
  

function instance(value){

  let data = JSON.parse(value);
    const instanceResources = data.map((instance,index)=>{
        `resource "aws_instance" "${instance.instance_tag}" {
            ami           = "${myFunction(instance.ami)}"
            instance_type = "${instance.instance_type}"
            associate_public_ip_address = true
            subnet_id     = aws_subnet.demo_pub_sn_1a.id
            vpc_security_group_ids = [aws_security_group.demo_sg_1.id]
         
            user_data = <<-EOF
                        #!/bin/bash
                        apt-get update
                        apt-get install -y ${instance.server}
                        sudo systemctl enable ${instance.server}
                        sudo systemctl start ${instance.server}    
                        cd /var/www/html
                        sudo chmod -R 777 .
                        git init
                        USERNAME="Harshu_terraform-at-729416225111"
                        PASSWORD="CXP6QRuEQT8NpuOjZhLbpBvYnERPLiZYld8OeUyaJlw="
                        git clone https://$USERNAME:$PASSWORD@git-codecommit.ap-south-1.amazonaws.com/v1/repos/datayaan_website2.0"
                        cd /var/www/html/datayaan_website2.0
                        mv /var/www/html/datayaan_website2.0/* /var/www/html
                        cd /var/www/html
                        rm -rf datayaan_website2.0
                        rm -rf index.nginx-debian.html                      
                        EOF
            tags = {
              Name = "demo_nginx"
          }
          }
          
          output "vpc_id_${instance.instance_tag}" {
            value = aws_vpc.${instance.instance_tag}.id
          }`
    }).join('')

    return instanceResources;
}

function load_balancer(value)
{
  let data = JSON.parse(value);
    const albResources = data.map((load_balancer,index)=>
    `resource "aws_lb" "${load_balancer.alb_tag}" {
        name               = "${load_balancer.alb_tag}"
        internal           = false
        load_balancer_type = "application"
        security_groups    = ["${load_balancer.security_group}"]                                
        subnets            = ${JSON.stringify(load_balancer.subnet)}
       
        enable_deletion_protection = false
       
        enable_http2                     = true
        idle_timeout                     = 60
        enable_cross_zone_load_balancing = true
      }
       
      resource "aws_lb_listener" "my-listener" {
        load_balancer_arn = aws_lb.${req.body.alb_tag}.arn
        port              = 80
        protocol          = "HTTP"
       
        default_action {
          type = "fixed-response"
       
          fixed_response {
            content_type = "text/plain"
            message_body = "Hello, World!"
            status_code  = "200"
          }
        }
      }
      
      resource "aws_lb_target_group" "${req.body.target_group_tag}" {
        name     = "${req.body.target_group_tag}"
        port     = 80
        protocol = "HTTP"
        vpc_id   =aws_vpc.${req.body.vpc}.id
      }
       
      resource "aws_lb_target_group_attachment" "my-target-attachment" {
        target_group_arn = aws_lb_target_group.my-target-group.arn
        target_id        = aws_instance.${req.body.instance}.id
        port             = 80
      }
      
      output "vpc_id_${load_balancer.alb_tag}" {
        value = aws_vpc.${load_balancer.alb_tag}.id
      }`).join('');
      return albResources;
}

function rds(value){
  let data = JSON.parse(value);
    const rdsResources =data.map((rds,index)=>
    `resource "aws_db_subnet_group" "${rds.db_subnet_group_name}" {
        name         = "${rds.db_subnet_group_name}"
        subnet_ids   = ${JSON.stringify(rds.subnet)}
        description  = "subnets for database instance"
        tags   = {
          Name = "${rds.db_subnet_group_name}"
        }
      }
       
      resource "aws_db_instance" "${rds.db_tag}" {
        engine                  = "${rds.engine}"
        engine_version          = "${rds.engine_version}"
        multi_az                = "${rds.multi_az}"
        identifier              = "demo-db-1"
        username                = "root"
        password                = "password123"
        instance_class          = "${rds.instance_class}"
        allocated_storage       = "${rds.allocated_storage}"
        db_subnet_group_name    = aws_db_subnet_group.${
            rds.db_subnet_group_name
        }.name
        vpc_security_group_ids  = ${rds.security_group}
        availability_zone       = "ap-south-1a"
        db_name                 = "${rds.db_name}"
        skip_final_snapshot     = true
          }

          output "vpc_id_${rds.db_tag}" {
            value = aws_vpc.${rds.db_tag}.id
          }
         `).join('');
         return rdsResources;
}

module.exports = {
    vpc, rds, load_balancer, instance, myFunction, security_group, private_route_table, public_route_table,
    internet_gateway, subnet
}


// "load_balancer": [
//     {
//         "alb_tag": "demo-alb",
//         "security_group": "",
//         "subnet": [
//             "",
//             ""
//         ],
//         "target_group_tag": "",
//         "instance": "",
//         "vpc": ""
//     }
// ],
// "rds": [
//     {
//         "db_subnet_group_name": "database_subnets_1",
//         "subnet": [
//             "",
//             ""
//         ],
//         "db_tag": "demo_tag",
//         "engine": "mysql",
//         "engine_version": "8.0.31",
//         "multi_az": false,
//         "username": "root",
//         "password": "password123",
//         "identifier": "",
//         "instance_class": "db.t2.micro",
//         "security_group":"",
//         "allocated_storage": 20,
//         "db_name": "datayaan_db"
//     }
// ]
// }