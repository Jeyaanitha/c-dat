
const fs = require('fs');
const { exec } = require('child_process');
//const AWS = require('aws-sdk');
//const { execSync } = require('child_process');
const path = require('path');
const simpleGit = require('simple-git');
// const { promisify } = require('util');
// const fs = require('fs').promises;
//const fs = require('fs').promises;
const architecture_func = require('../resource')
// const {ListRepositoriesCommand, CodeCommitClient} = require('@aws-sdk/client-codecommit');


//AWS LOGIN
async function aws_login(req, res) {
  try {
    if (`${req.body.username}` === "demo" && `${req.body.password}` === "demo@123") {
      const tfConfig = `
            provider "aws" {
              access_key = "AKIA2TVEYKFL66QXICEW"
              secret_key = "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"
                region     = "ap-south-1"
              }`;

      // Write the Terraform configuration to a file
      fs.appendFileSync('/home/dys/project/Backend-Terraform-Nodejs/main.tf', tfConfig);
      
      // Define the relative path to the Terraform configuration directory
      const configPath = '/home/dys/project/Backend-Terraform-Nodejs';

      // Change the current working directory to the Terraform configuration directory
      process.chdir(configPath);

      //  Run Terraform commands
      exec('terraform init', (error, initStdout, initStderr) => {
        if (error) {
          console.error('Terraform initialization failed:', initStderr);
          res.status(400).send("Terraform initialization failed");
        } else {
          console.log('Terraform initialization succeeded.');
          exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
            if (applyError) {
              console.error('Terraform apply failed:', applyStderr);
              res.status(400).send("Terraform apply failed");
            } else {
              console.log('Terraform apply succeeded.');
              res.status(200).send("Login Successfully.");
            }
          });
        }
      });
    }
    else {
      res.status(404).send("Invalid user name and password")
    }
  }
  catch (error) {
    console.log("error is : ", error)
    res.status(400).send("An error occurred in AWS LOGIN");
  }
}

// TO CREATE VPC
async function static_vpc(req, res) {
  try {
    const tfConfig = `
        // vpc
        resource "aws_vpc" "demo_vpc" {
            cidr_block       = "10.0.0.0/16"
            instance_tenancy = "default"
            tags = {
              Name = "demo_vpc"
            }
          }
          
          // 2 public create subnet - 1a
          resource "aws_subnet" "demo_pub_subnet" {
            vpc_id     = aws_vpc.demo_vpc.id
            cidr_block = "10.0.1.0/24"
            availability_zone = "ap-south-1a"
            map_public_ip_on_launch = true
            tags = {
              Name = "demo_pub_subnet"
            }
          }
  
          //3 private subnet - 1a
          resource "aws_subnet" "demo_pvt_subnet" {
             vpc_id     = aws_vpc.demo_vpc.id
             cidr_block = "10.0.2.0/24"
             availability_zone = "ap-south-1a"
             tags = {
             Name = "demo_pvt_subnet"
            }
          }
          
          //4 public create subnet - 1b
          resource "aws_subnet" "demo_pub_subnet_1b" {
            vpc_id     = aws_vpc.demo_vpc.id
            cidr_block = "10.0.3.0/24"
            availability_zone = "ap-south-1b"
            map_public_ip_on_launch = true
            tags = {
              Name = "demo_pub_subnet_1b"
            }
          }
  
          // private subnet - 1b
          resource "aws_subnet" "demo_pvt_subnet_1b" {
             vpc_id     = aws_vpc.demo_vpc.id
             cidr_block = "10.0.4.0/24"
             availability_zone = "ap-south-1b"
             tags = {
             Name = "demo_pvt_subnet_1b"
            }
          }

          //3 create internet gateway
          resource "aws_internet_gateway" "demo_igw" {
          vpc_id = aws_vpc.demo_vpc.id
            tags = {
              Name = "demo_igw"
            }
          }
           
          //4 public route table
          resource "aws_route_table" "demo_pub_rt" {
          vpc_id = aws_vpc.demo_vpc.id
            route {
              cidr_block = "0.0.0.0/0"
              gateway_id = aws_internet_gateway.demo_igw.id
            }
            tags = {
              Name = "demo_pub_rt"
            }
          }
          
          //5 associate public subnet with route table
          resource "aws_route_table_association" "demo_pub_sn_asso" {
            subnet_id      = aws_subnet.demo_pub_subnet.id 
            route_table_id = aws_route_table.demo_pub_rt.id
          }
           
          //6 associate public subnet 1b with route table
          resource "aws_route_table_association" "demo_pub_sn_asso_1b" {
            subnet_id      = aws_subnet.demo_pub_subnet_1b.id 
            route_table_id = aws_route_table.demo_pub_rt.id
          }
          
          
          //7 route table for private
          resource "aws_route_table" "demo_pvt_rt" {
            vpc_id = aws_vpc.demo_vpc.id
            tags = {
              Name = "demo_pvt_rt"
            }
          }
           
          //8 associate private subnet 1b with route table
          resource "aws_route_table_association" "demo_pvt_sn_asso" {
            subnet_id      = aws_subnet.demo_pvt_subnet.id
            route_table_id = aws_route_table.demo_pvt_rt.id
          }
          
          //9 associate private subnet 1b with route table
          resource "aws_route_table_association" "demo_pvt_sn_asso_1b" {
            subnet_id      = aws_subnet.demo_pvt_subnet_1b.id
            route_table_id = aws_route_table.demo_pvt_rt.id
          }

          // public security group
          resource "aws_security_group" "demo_sg_pub" {
            name        = "demo_sg_pub"
            description = "Allow TLS inbound traffic"
            vpc_id      =  aws_vpc.demo_vpc.id
          
          //type ssh,rdp,http
            ingress {
              description      = "TLS from VPC"
              from_port        = 22
              to_port          = 22
              protocol         = "tcp" 
              cidr_blocks      = ["0.0.0.0/0"]  
              ipv6_cidr_blocks = ["::/0"]
            }
              ingress {
              description      = "TLS from VPC"
              from_port        = 443
              to_port          = 443
              protocol         = "tcp" 
              cidr_blocks      = ["0.0.0.0/0"] 
              ipv6_cidr_blocks = ["::/0"]
            }
              ingress {
              description      = "TLS from VPC"
              from_port        = 80
              to_port          = 80
              protocol         = "tcp" 
              cidr_blocks      = ["0.0.0.0/0"] 
              ipv6_cidr_blocks = ["::/0"]
            }
          
            egress {
              from_port        = 0
              to_port          = 0
              protocol         = "-1"
              cidr_blocks      = ["0.0.0.0/0"]
              ipv6_cidr_blocks = ["::/0"]
            }
          
            tags = {
              Name = "demo_sg_pub"
            }
          }

          
          // private security group
          resource "aws_security_group" "demo_sg_pvt" {
            name        = "demo_sg_pvt"
            description = "Allow TLS inbound traffic"
            vpc_id      = aws_vpc.demo_vpc.id
          
            ingress {
              description      = "TLS from VPC"
              from_port        = 0
              to_port          = 65535
              protocol         = "tcp" 
              cidr_blocks      = ["10.0.1.0/24"]  
              ipv6_cidr_blocks = ["::/0"]
            }     
            egress {
              from_port        = 0
              to_port          = 0
              protocol         = "-1"
              cidr_blocks      = ["0.0.0.0/0"]
              ipv6_cidr_blocks = ["::/0"]
            }
          
            tags = {
              Name = "demo_sg_pvt"
            }
          } 
          `;

    const output = `output "vpcs" {
      value = {
        v = {
          id   = aws_vpc.demo_vpc.id
          tags = aws_vpc.demo_vpc.tags
        }
      
        pub_subnet = {
          id   = aws_subnet.demo_pub_subnet.id
          tags = aws_subnet.demo_pub_subnet.tags
        }
      
        pvt_subnet = {
          id   = aws_subnet.demo_pvt_subnet.id
          tags = aws_subnet.demo_pvt_subnet.tags
        }
      
        pub_subnet_1b = {
          id   = aws_subnet.demo_pub_subnet_1b.id
          tags = aws_subnet.demo_pub_subnet_1b.tags
        }
      
        pvt_subnet_1b = {
          id   = aws_subnet.demo_pvt_subnet_1b.id
          tags = aws_subnet.demo_pvt_subnet_1b.tags
        }
      
        internet_gateway = {
          id   = aws_internet_gateway.demo_igw.id
          tags = aws_internet_gateway.demo_igw.tags
        }
      
        pub_route_table = {
          id   = aws_route_table.demo_pub_rt.id
          tags = aws_route_table.demo_pub_rt.tags
        }
      
        pvt_route_table = {
          id   = aws_route_table.demo_pvt_rt.id
          tags = aws_route_table.demo_pvt_rt.tags
        }
      
        pub_sg = {
          id   = aws_security_group.demo_sg_pub.id
          tags = aws_security_group.demo_sg_pub.tags
        }
      
        pvt_sg = {
          id   = aws_security_group.demo_sg_pvt.id
          tags = aws_security_group.demo_sg_pvt.tags
        }
      }
    }`;

    // Write the Terraform configuration to a file
   
    fs.writeFileSync('D:/DAT/vpc.tf', tfConfig);
    fs.writeFileSync('D:/DAT/vpc_output.tf', output);

    // Define the relative path to the Terraform configuration directory
    const configPath = 'D:/DAT';

    // Change the current working directory to the Terraform configuration directory
    process.chdir(configPath);
    exec('terraform apply -auto-approve -parallelism=10', (applyError, applyStdout, applyStderr) => {
      if (applyError) {
        console.error('Terraform apply failed:', applyStderr);
        return res.status(400).send("Terraform apply failed");
      }else{
      console.error('Terraform success:', applyStdout);
      const resourceIds = [];
      // Regular expression pattern to extract resource information
      const resourcePattern = /"id"\s*=\s*"([^"]+)"/g;
      let match;
      while ((match = resourcePattern.exec(applyStdout)) !== null) {
      const resourceId = match[1];

      // Log extracted values
      console.log('Resource ID:', resourceId);

      // Store the resource ID
      resourceIds.push(resourceId);
}

  console.log('Resource IDs:', resourceIds);
  res.status(200).json({ message: 'VPC created successfully', resourceIds });
  } 
});     
} catch (error) {
    console.log('error is:', error);
    res.status(400).send('An error occurred (VPC)');
  }
}

async function vpc_list(req, res) {
  try {
    const tfConfig = `data "aws_vpcs" "foo" {
          }
          output "foo" {
            value = data.aws_vpcs.foo.ids
          }`;

    // Write the Terraform configuration to a file
  
    fs.appendFileSync('D:/DAT/vpc_list.tf', tfConfig);

    // Define the relative path to the Terraform configuration directory
    const configPath = 'D:/DAT';

    // Change the current working directory to the Terraform configuration directory
    process.chdir(configPath);

    // Run Terraform commands

    exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
      if (applyError) {
        console.error('Terraform apply failed:', applyStderr);
        res.send("Terraform apply failed");
      } else {
        console.log('Terraform apply succeeded.');
        console.log(applyStdout);
        const vpcIdRegex = /"vpc-\w+"/g;
        const matchArray = applyStdout.match(vpcIdRegex);
        const vpcIds = matchArray.map(match => match.replace(/"/g, ''));
        res.status(200).json({ message: 'VPC list', vpcIds });
      }
    });
  } catch (error) {
    console.log("error is:", error);
    res.status(400).send("An error occurred(VPC)");
  }
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

async function ec2_instance(req, res) {
  try {
    const tfConfig = `
        data "aws_ami" "${req.body.os_name}" {
            most_recent = true
          
            filter {
              name   = "name"
              values = ["${req.body.os_value}"]
            }
            
            filter {
              name   = "virtualization-type"
              values = ["hvm"]
            }
          
          }
          resource "aws_instance" "demo_${req.body.os_name}"{
              ami = data.aws_ami.${req.body.os_name}.id
              instance_type = "${req.body.instance_type}"
              associate_public_ip_address = true
              subnet_id = "${req.body.subnet_id}"
              vpc_security_group_ids = ["${req.body.vpc_security_group_ids}"]
              tags = {
              Name = "demo_${req.body.os_name}_1"
            }
      }
      `;

      const ec2_output = `output "EC2_instance_info" {
        value = {
          ec2_instance = {
            id   = aws_instance.demo_${req.body.os_name}.id
            tags = aws_instance.demo_${req.body.os_name}.tags
          }
        }
      }` 
       // Write the Terraform configuration to a file
      
      fs.appendFileSync('D:/DAT/ec2_instance.tf', tfConfig);
      
      fs.appendFileSync('D:/DAT/ec2_output.tf', ec2_output);

    // Define the relative path to the Terraform configuration directory
    const configPath = 'D:/DAT';

    // Change the current working directory to the Terraform configuration directory
    process.chdir(configPath);

    // Run Terraform commands
    exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
      if (applyError) {
        console.error('Terraform apply failed:', applyStderr);
        res.status(400).send("Terraform apply failed");
      } else {
        console.log('Terraform apply succeeded.');
    
        try {
          const vpcIds = [];
          const ec2Ids = [];
    
          // Regular expression pattern to extract VPC ID
          const vpcPattern = /"v"\s*=\s*{\s*"id"\s*=\s*"([^"]+)"/g;
          let vpcMatch;
          while ((vpcMatch = vpcPattern.exec(applyStdout)) !== null) {
            const vpcId = vpcMatch[1];
            console.log('VPC ID:', vpcId);
            vpcIds.push(vpcId);
          }
          // Regular expression pattern to extract EC2 instance ID
          const ec2Pattern = /"ec2_instance"\s*=\s*{\s*"id"\s*=\s*"([^"]+)"/g;
          let ec2Match;
          while ((ec2Match = ec2Pattern.exec(applyStdout)) !== null) {
            const ec2Id = ec2Match[1];
            console.log('EC2 Instance ID:', ec2Id);
            // console.log('EC2 Instance Tags:', tags);
            ec2Ids.push(ec2Id);
          }  
          res.status(200).json({
            message: 'EC2 instance created successfully',
            resourceIds: [...vpcIds, ...ec2Ids,`${req.body.subnet_id}`,`${req.body.vpc_security_group_ids}`],
          });
        } catch (jsonError) {
          console.error('Error parsing JSON output:', jsonError);
          res.status(500).send('Internal Server Error');
        }
      }
    });   
  }
  catch (error) {
    console.log("error is : ", error)
    res.send("An error occurred (EC2 INSTANCE)");
  }
}

async function security_group_list(req, res) {
  try {
    const tfConfig = `
          data "aws_security_groups" "dys-sg" {
          }
          output "dys-sg" {
             value = data.aws_security_groups.dys-sg.ids
          }`;
       
     fs.appendFileSync('D:/DAT/security_group_list.tf', tfConfig);

    // Define the relative path to the Terraform configuration directory
    const configPath = 'D:/DAT';

    // Change the current working directory to the Terraform configuration directory
    process.chdir(configPath);

    exec('terraform init', (error, initStdout, initStderr) => {
      if (error) {
        console.error('Terraform initialization failed:', initStderr);
        res.send("Terraform initialization failed");
      } else {
        console.log('Terraform initialization succeeded.');
        exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
          if (applyError) {
            console.error('Terraform apply failed:', applyStderr);
            res.send("Terraform apply failed");
          } else {
            console.log('Terraform apply succeeded.');
            console.log(applyStdout);
            const securityGroupIdRegex = /"sg-\w+"/g;
            const matchArray = applyStdout.match(securityGroupIdRegex);
            const securityGroupIds = matchArray.map(match => match.replace(/"/g, ''));
            res.status(200).json({ message: 'Security Group IDs:', securityGroupIds });

          }
        });
      }
    });
  } catch (error) {
    console.log("error is : ", error);
    res.send("An error occurred in (Security Group)");
  }
}
async function subnet_list(req, res) {
  try {
    const tfConfig = `data "aws_subnet" "sn" {
          }
          
          output "sn" {
            value = data.aws_subnet.sn.id
          }`;
          
    // Write the Terraform configuration to a file
    fs.appendFileSync('D:/DAT/subnet_list.tf', tfConfig);
    

    // Define the relative path to the Terraform configuration directory
    const configPath = 'D:/DAT';

    // Change the current working directory to the Terraform configuration directory
    process.chdir(configPath);

    // Run Terraform commands

    exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
      if (applyError) {
        console.error('Terraform apply failed:', applyStderr);
        res.send("Terraform apply failed");
      } else {
        console.log('Terraform apply succeeded.');
        console.log(applyStdout);
        const subnetIdRegex = /"subnet-\w+"/g;
        const matchArray = applyStdout.match(subnetIdRegex);
        const subnetIds = matchArray.map(match => match.replace(/"/g, ''));
        res.status(200).json({ message: 'Subnet IDs:', subnetIds });
      }
    });

  } catch (error) {
    const response = {
      error: error.message,
    };
    res.status(500).json(response); 
  }
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

async function os_list(req, res) {
  try {
    const os_list = [
      "Amazon Linux 2023 kernel-6.1",
      "Amazon Linux 2 Kernel-5.10",
      "Ubuntu focal 20.04 LTS",
      "Ubuntu jammy 22.04 LTS",
      "Windows server core base-2022",
      "Windows server core base-2019",
      "Windows server core base-2016",
      "Windows with SQL server-2022 Standard",
      "Red Had Enterprise Linux 9"
    ]
    res.status(200).json({ message: "OS List:", os_list:os_list });
  } catch (error) {
    console.log("error is : ", error);
    res.send("An error occurred in (OS LIST)");
  }
}

// async function vpc_archi(req, res) {
//   try {
//     const vpcName = "demo_vpc";
//     const tfConfigPath = '/home/dys-10156/Videos/DAT/terraform/aws_vpc.tf'
 
//     // Check if the Terraform configuration file exists, and create it if not
// if (!fs.existsSync(tfConfigPath)) {
//   fs.writeFileSync(tfConfigPath, ''); // Create an empty file
// }
// const tfContent = fs.readFileSync(tfConfigPath, 'utf8');
//     if (tfContent.includes(`"${vpcName}"`)) {
//       console.log(`VPC with the name "${vpcName}" already exists in the configuration.`);
//       return res.status(400).send(`VPC with the name "${vpcName}" already exists in the configuration.`)
//     } else {
//       const ingressRules = generateIngressRules(req.body.protocol);
//       let result = myFunction(req.body.ami)
//     const tfConfig = `
//     resource "aws_vpc" "${req.body.vpc_tag}" {
//       cidr_block       = "${req.body.vpc_cidr}"
//       instance_tenancy = "default"
//       tags = {
//         Name = "${req.body.vpc_tag}"
//       }
//     }
 
//     //2 public create subnet
//     resource "aws_subnet" "${req.body.pub_sn_1a_tag}" {
//       vpc_id     = aws_vpc.${req.body.vpc_tag}.id
//       cidr_block = "${req.body.pub_cidr_1a}"
//       availability_zone = "${req.body.pub_az_1a}"
//       map_public_ip_on_launch = true
//       tags = {
//         Name = "${req.body.pub_sn_1a_tag}"
//       }
//     }
     
//     // private subnet
//     resource "aws_subnet" "${req.body.pvt_sn_1a_tag}" {
//        vpc_id     = aws_vpc.${req.body.vpc_tag}.id
//        cidr_block = "${req.body.pvt_cidr_1a}"
//        availability_zone = "${req.body.pvt_az_1a}"
//        tags = {
//        Name = "${req.body.pvt_sn_1a_tag}"
//       }
//     }
     
//     resource "aws_subnet" "${req.body.pub_sn_1b_tag}" {
//         vpc_id     = aws_vpc.${req.body.vpc_tag}.id
//         cidr_block = "${req.body.pub_cidr_1b}"
//         availability_zone = "${req.body.pub_az_1b}"
//         map_public_ip_on_launch = true
//         tags = {
//           Name = "${req.body.pub_sn_1b_tag}"
//         }
//       }
       
//       // private subnet
//       resource "aws_subnet" "${req.body.pvt_sn_1b_tag}"{
//          vpc_id     = aws_vpc.${req.body.vpc_tag}.id
//          cidr_block = "${req.body.pvt_cidr_1b}"
//          availability_zone = "${req.body.pvt_az_1b}"
//          tags = {
//          Name = "${req.body.ppvt_sn_1b_tag}"
//         }
//       }
 
//     //3 create internet gateway
//     resource "aws_internet_gateway" "${req.body.igw_tag}" {
//     vpc_id = aws_vpc.${req.body.vpc_tag}.id
//       tags = {
//         Name = "${req.body.igw_tag}"
//       }
//     }
 
//     //4 public route table
// resource "aws_route_table" "${req.body.pub_rt_tag}" {
//   vpc_id = aws_vpc.${req.body.vpc_tag}.id
//     route {
//       cidr_block = "0.0.0.0/0"
//       gateway_id = aws_internet_gateway.${req.body.igw_tag}.id
//     }
   
//     tags = {
//       Name = "${req.body.pub_rt_tag}"
//     }
//   }
   
//   //5 route table for private
//   resource "aws_route_table" "${req.body.pvt_rt_tag}" {
//     vpc_id = aws_vpc.${req.body.vpc_tag}.id
//     tags = {
//       Name = "${req.body.pvt_rt_tag}"
//     }
//   }
//   //associate public subnet with route table
//   resource "aws_route_table_association" "pub_asso_1a" {
//     subnet_id      = aws_subnet.${req.body.pub_sn_1a_tag}.id // which
//     route_table_id = aws_route_table.${req.body.pub_rt_tag}.id
//   }
   
//   //associate private subnet with route table
//   resource "aws_route_table_association" "pvb_asso_1a" {
//     subnet_id      = aws_subnet.${req.body.pvt_sn_1a_tag}.id
//     route_table_id = aws_route_table.${req.body.pvt_rt_tag}.id
//   }
   
   
//   //associate public subnet with route table
//   resource "aws_route_table_association" "pub_asso_1b" {
//     subnet_id      = aws_subnet.${req.body.pub_sn_1b_tag}.id // which
//     route_table_id = aws_route_table.${req.body.pub_rt_tag}.id
//   }
//   //associate private subnet with route table
//   resource "aws_route_table_association" "pvt_asso_1b" {
//     subnet_id      = aws_subnet.${req.body.pvt_sn_1b_tag}.id
//     route_table_id = aws_route_table.${req.body.pvt_rt_tag}.id
//   }
   
    
//     //7 security group
//     resource "aws_security_group" "${req.body.pub_sg_tag}" {
//       name        = "${req.body.pub_sg_tag}"
//       description = "Allow TLS inbound traffic"
//       vpc_id      = aws_vpc.${req.body.vpc_tag}.id
//       ${ingressRules}
//       egress {
//         from_port        = 0
//         to_port          = 0
//         protocol         = "-1"
//         cidr_blocks      = ["0.0.0.0/0"]
//         ipv6_cidr_blocks = ["::/0"]
//       }
    
//       tags = {
//         Name = "${req.body.pub_sg_tag}"
//       }
//     }
 
//     // ec2 instance
//     resource "aws_instance" "${req.body.instance_tag}" {
//       ami           = "${result}"
//       instance_type = "${req.body.instance_type}"
//       associate_public_ip_address = true
//       subnet_id     = aws_subnet.${req.body.pub_sn_1a_tag}.id
//       vpc_security_group_ids = [aws_security_group.${req.body.pub_sg_tag}.id]
    
//       user_data = <<-EOF
//                   #!/bin/bash
//                   apt-get update
//                   apt-get install -y ${req.body.server}
//                   sudo systemctl enable ${req.body.server}
//                   sudo systemctl start ${req.body.server}     
//                   cd /var/www/html
//                   sudo chmod -R 777 .
//                   git init
//                   USERNAME="Harshu_terraform-at-729416225111"
//                   PASSWORD="CXP6QRuEQT8NpuOjZhLbpBvYnERPLiZYld8OeUyaJlw="
//                   git clone https://$USERNAME:$PASSWORD@git-codecommit.ap-south-1.amazonaws.com/v1/repos/datayaan-repo
//                   cd /var/www/html/datayaan-repo
//                   mv /var/www/html/datayaan-repo/* /var/www/html
//                   cd /var/www/html
//                   rm -rf datayaan-repo
//                   rm -rf index.nginx-debian.html                      
//                   EOF
//       tags = {
//         Name = "demo_nginx"
//     }
//     }  
 
    
// //load balancer:
// resource "aws_lb" "${req.body.alb_tag}" {
//   name               = "${req.body.alb_tag}"
//   internal           = false
//   load_balancer_type = "application"
//   //security_groups    = ["${req.body.alb_security_group}"]                                 
// // subnets            = ${JSON.stringify(req.body.alb_subnet_id)}
//   security_groups = [aws_security_group.${req.body.pub_sg_tag}.id]
//   subnets =[aws_subnet.${req.body.pub_sn_1a_tag}.id,aws_subnet.${req.body.pub_sn_1b_tag}.id]
 
//   enable_deletion_protection = false
 
//   enable_http2                     = true
//   idle_timeout                     = 60
//   enable_cross_zone_load_balancing = true
// }
 
// resource "aws_lb_listener" "my-listener" {
//   load_balancer_arn = aws_lb.${req.body.alb_tag}.arn
//   port              = 80
//   protocol          = "HTTP"
 
//   default_action {
//     type = "fixed-response"
//     fixed_response {
//       content_type = "text/plain"
//       message_body = "Hello, World!"
//       status_code  = "200"
//     }
//   }
// }
 
// resource "aws_lb_target_group" "my-target-group" {
//   name     = "my-target-group"
//   port     = 80
//   protocol = "HTTP"
//   vpc_id   =aws_vpc.${req.body.vpc_tag}.id
// }
 
// resource "aws_lb_target_group_attachment" "my-target-attachment" {
//   target_group_arn = aws_lb_target_group.my-target-group.arn
//   target_id        = aws_instance.${req.body.instance_tag}.id
//   port             = 80
// }
// `;

// const output = `output "vpcs" {
//   value = {
//     v = {
//       id   = aws_vpc.${req.body.vpc_tag}.id
//       //tags = aws_vpc.${req.body.vpc_tag}.tags
//     }
  
//     pub_subnet = {
//       id   = aws_subnet.${req.body.pub_sn_1a_tag}.id
//      // tags = aws_subnet.${req.body.pub_sn_1a_tag}.tags
//     }
  
//     pvt_subnet = {
//       id   = aws_subnet.${req.body.pvt_sn_1a_tag}.id
//       //tags = aws_subnet.${req.body.pvt_sn_1a_tag}.tags
//     }
  
//     pub_subnet_1b = {
//       id   = aws_subnet.${req.body.pub_sn_1b_tag}.id
//       //tags = aws_subnet.${req.body.pub_sn_1b_tag}.tags
//     }
  
//     pvt_subnet_1b = {
//       id   = aws_subnet.${req.body.pvt_sn_1b_tag}.id
//       //tags = aws_subnet.${req.body.pvt_sn_1b_tag}.tags
//     }
  
//     internet_gateway = {
//       id   = aws_internet_gateway.${req.body.igw_tag}.id
//      // tags = aws_internet_gateway.${req.body.igw_tag}.tags
//     }
  
//     pub_route_table = {
//        id   = aws_route_table.${req.body.pub_rt_tag}.id
//       // tags = aws_route_table.${req.body.pub_rt_tag}.tags
//     }
  
//      pvt_route_table = {
//        id   = aws_route_table.${req.body.pvt_rt_tag}.id
//        //tags = aws_route_table.${req.body.pvt_rt_tag}.tags
//      }
  
//     pub_sg = {
//       id   = aws_security_group.${req.body.pub_sg_tag}.id
//       //tags = aws_security_group.${req.body.pub_sg_tag}.tags
//     }
  
//     // pvt_sg = {
//     //   id   = aws_security_group.demo_sg_pvt.id
//     //   //tags = aws_security_group.demo_sg_pvt.tags
//     // }
    
//     load_balancer = {
//       id   = aws_lb.${req.body.alb_tag}.id
//     }

//     instance = {
//       id   = aws_instance.${req.body.instance_tag}.id
//       ip = aws_instance.${req.body.instance_tag}.public_ip
//     }  }
// }`;
 
//     // Write the Terraform configuration to a file
//     fs.appendFileSync("/home/dys-10156/Videos/DAT/terraform/aws_vpc.tf", tfConfig);
//     fs.appendFileSync("/home/dys-10156/Videos/DAT/terraform/aws_vpc_output.tf", output);
//   }
//     // Define the relative path to the Terraform configuration directory
//     const configPath = "/home/dys-10156/Videos/DAT/terraform";
 
//     // Change the current working directory to the Terraform configuration directory
//     process.chdir(configPath);
//     exec(
//       "terraform apply -auto-approve -parallelism=10",
//       (applyError, applyStdout, applyStderr) => {
//         if (applyError) {
//           console.error("Terraform apply failed:", applyStderr);
//           return res.status(400).send("Terraform apply failed");
//         } else {
//           console.error("Terraform success:", applyStdout);
//           const resourceIds = [];
//           // Regular expression pattern to extract resource information
//           const resourcePattern = /"id"\s*=\s*"([^"]+)"/g;
//           let match;
//           while ((match = resourcePattern.exec(applyStdout)) !== null) {
//             const resourceId = match[1];
 
//             // Log extracted values
//             console.log("Resource ID:", resourceId);
 
//             // Store the resource ID
//             resourceIds.push(resourceId);
//           }
 
//           console.log("Resource IDs:", resourceIds);
//           res
//             .status(200)
//             .json({ message: "YOUR APPLICATION HAS BEED DEPLOYED SUCCESSFULLY !!!",result:resourceIds});
//         }
//       }
//     );
//   } catch (error) {
//     console.log("error is:", error);+
//     res.status(400).send("An error occurred (VPC)");
//   }
// }
async function vpc_archi(req, res) {
  try {
    const vpcName = req.body.vpc_tag;
    const tfConfigPath = "/home/dys/project/Backend-Terraform-Nodejs/aws_vpc.tf";
 
    // Check if the Terraform configuration file exists, and create it if not
    if (!fs.existsSync(tfConfigPath)) {
      fs.writeFileSync(tfConfigPath, ""); // Create an empty file
    }
    const tfContent = fs.readFileSync(tfConfigPath, "utf8");
    if (tfContent.includes(`"${vpcName}"`)) {
      console.log(
        `VPC with the name "${vpcName}" already exists in the configuration.`
      );
      return res
        .status(400)
        .send(
          `VPC with the name "${vpcName}" already exists in the configuration.`
        );
    } else {
      const ingressRules = generateIngressRules(req.body.protocol);
      let result = myFunction(req.body.ami);
      const tfConfig = `
    resource "aws_vpc" "${req.body.vpc_tag}" {
      cidr_block       = "${req.body.vpc_cidr}"
      instance_tenancy = "default"
      tags = {
        Name = "${req.body.vpc_tag}"
      }
    }
 
    //2 public create subnet
    resource "aws_subnet" "${req.body.pub_sn_1a_tag}" {
      vpc_id     = aws_vpc.${req.body.vpc_tag}.id
      cidr_block = "${req.body.pub_cidr_1a}"
      availability_zone = "${req.body.pub_az_1a}"
      map_public_ip_on_launch = true
      tags = {
        Name = "${req.body.pub_sn_1a_tag}"
      }
    }
   
    // private subnet
    resource "aws_subnet" "${req.body.pvt_sn_1a_tag}" {
       vpc_id     = aws_vpc.${req.body.vpc_tag}.id
       cidr_block = "${req.body.pvt_cidr_1a}"
       availability_zone = "${req.body.pvt_az_1a}"
       tags = {
       Name = "${req.body.pvt_sn_1a_tag}"
      }
    }
     
    resource "aws_subnet" "${req.body.pub_sn_1b_tag}" {
        vpc_id     = aws_vpc.${req.body.vpc_tag}.id
        cidr_block = "${req.body.pub_cidr_1b}"
        availability_zone = "${req.body.pub_az_1b}"
        map_public_ip_on_launch = true
        tags = {
          Name = "${req.body.pub_sn_1b_tag}"
        }
      }
       
      // private subnet
      resource "aws_subnet" "${req.body.pvt_sn_1b_tag}"{
         vpc_id     = aws_vpc.${req.body.vpc_tag}.id
         cidr_block = "${req.body.pvt_cidr_1b}"
         availability_zone = "${req.body.pvt_az_1b}"
         tags = {
         Name = "${req.body.pvt_sn_1b_tag}"
        }
      }
 
    //3 create internet gateway
    resource "aws_internet_gateway" "${req.body.igw_tag}" {
    vpc_id = aws_vpc.${req.body.vpc_tag}.id
      tags = {
        Name = "${req.body.igw_tag}"
      }
    }
 
    //4 public route table
resource "aws_route_table" "${req.body.pub_rt_tag}" {
  vpc_id = aws_vpc.${req.body.vpc_tag}.id
    route {
      cidr_block = "0.0.0.0/0"
      gateway_id = aws_internet_gateway.${req.body.igw_tag}.id
    }
   
    tags = {
      Name = "${req.body.pub_rt_tag}"
    }
  }
   
  //5 route table for private
  resource "aws_route_table" "${req.body.pvt_rt_tag}" {
    vpc_id = aws_vpc.${req.body.vpc_tag}.id
    tags = {
      Name = "${req.body.pvt_rt_tag}"
    }
  }
  //associate public subnet with route table
  resource "aws_route_table_association" "pub_asso_1a" {
    subnet_id      = aws_subnet.${req.body.pub_sn_1a_tag}.id // which
    route_table_id = aws_route_table.${req.body.pub_rt_tag}.id
  }
   
  //associate private subnet with route table
  resource "aws_route_table_association" "pvb_asso_1a" {
    subnet_id      = aws_subnet.${req.body.pvt_sn_1a_tag}.id
    route_table_id = aws_route_table.${req.body.pvt_rt_tag}.id
  }
   
   
  //associate public subnet with route table
  resource "aws_route_table_association" "pub_asso_1b" {
    subnet_id      = aws_subnet.${req.body.pub_sn_1b_tag}.id // which
    route_table_id = aws_route_table.${req.body.pub_rt_tag}.id
  }
  //associate private subnet with route table
  resource "aws_route_table_association" "pvt_asso_1b" {
    subnet_id      = aws_subnet.${req.body.pvt_sn_1b_tag}.id
    route_table_id = aws_route_table.${req.body.pvt_rt_tag}.id
  }
   
   
    //7 security group
    resource "aws_security_group" "${req.body.pub_sg_tag}" {
      name        = "${req.body.pub_sg_tag}"
      description = "Allow TLS inbound traffic"
      vpc_id      = aws_vpc.${req.body.vpc_tag}.id
      ${ingressRules}
      egress {
        from_port        = 0
        to_port          = 0
        protocol         = "-1"
        cidr_blocks      = ["0.0.0.0/0"]
        ipv6_cidr_blocks = ["::/0"]
      }
   
      tags = {
        Name = "${req.body.pub_sg_tag}"
      }
    }
 
    // ec2 instance
    resource "aws_instance" "${req.body.instance_tag}" {
      ami           = "${result}"
      instance_type = "${req.body.instance_type}"
      associate_public_ip_address = true
      subnet_id     = aws_subnet.${req.body.pub_sn_1a_tag}.id
      vpc_security_group_ids = [aws_security_group.${req.body.pub_sg_tag}.id]

      user_data = <<-EOF
                  #!/bin/bash
                  apt-get update
                  apt-get install -y ${req.body.server}
                  sudo systemctl enable ${req.body.server}
                  sudo systemctl start ${req.body.server}    
                  cd /var/www/html
                  sudo chmod -R 777 .
                  git init
                  USERNAME="Harshu_terraform-at-729416225111"
                  PASSWORD="CXP6QRuEQT8NpuOjZhLbpBvYnERPLiZYld8OeUyaJlw="
                  git clone https://$USERNAME:$PASSWORD@git-codecommit.ap-south-1.amazonaws.com/v1/repos/datayaan_website2.0
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
 
   
//load balancer:
resource "aws_lb" "${req.body.alb_tag}" {
  name               = "${req.body.alb_tag}"
  internal           = false
  load_balancer_type = "application"
  //security_groups    = ["${
    req.body.alb_security_group
  }"]                                
// subnets            = ${JSON.stringify(req.body.alb_subnet_id)}
  security_groups = [aws_security_group.${req.body.pub_sg_tag}.id]
  subnets =[aws_subnet.${req.body.pub_sn_1a_tag}.id,aws_subnet.${
        req.body.pub_sn_1b_tag
      }.id]
 
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
 
resource "aws_lb_target_group" "my-target-group" {
  name     = "my-target-group"
  port     = 80
  protocol = "HTTP"
  vpc_id   =aws_vpc.${req.body.vpc_tag}.id
}
 
resource "aws_lb_target_group_attachment" "my-target-attachment" {
  target_group_arn = aws_lb_target_group.my-target-group.arn
  target_id        = aws_instance.${req.body.instance_tag}.id
  port             = 80
}
 
# create the subnet group for the rds instance
resource "aws_db_subnet_group" "${req.body.db_subnet_group_name}" {
  name         = "${req.body.db_subnet_group_name}"
  subnet_ids   = [aws_subnet.${req.body.pvt_sn_1a_tag}.id, aws_subnet.${
        req.body.pvt_sn_1b_tag
      }.id]
  description  = "subnets for database instance"
 
  tags   = {
    Name = "${req.body.db_subnet_group_name}"
  }
}
 
resource "aws_db_instance" "${req.body.db_tag}" {
  engine                  = "${req.body.engine}"
  engine_version          = "${req.body.engine_version}"
  multi_az                = false
  identifier              = "demo-db-1"
  username                = "root"
  password                = "password123"
  instance_class          = "${req.body.instance_class}"
  allocated_storage       = "${req.body.allocated_storage}"
  db_subnet_group_name    = aws_db_subnet_group.${
    req.body.db_subnet_group_name
  }.name
  vpc_security_group_ids  = [aws_security_group.${req.body.pub_sg_tag}.id]
  availability_zone       = "ap-south-1a"
  db_name                 = "${req.body.db_name}"
  skip_final_snapshot     = true
 
    }
   
    `;

    var output = `output "ec2"{
      value = {
        ec = {
        id = aws_instance.${req.body.instance_tag}.id
        ip = aws_instance.${req.body.instance_tag}.public_ip
      }
     }
    }

    `;
    output += `output "vpcs" {
      value = {
        v = {
          id   = aws_vpc.${req.body.vpc_tag}.id
        }
     
        pub_subnet = {
          id   = aws_subnet.${req.body.pub_sn_1a_tag}.id
     
        }
     
        pvt_subnet = {
          id   = aws_subnet.${req.body.pvt_sn_1a_tag}.id
        }
     
        pub_subnet_1b = {
          id   = aws_subnet.${req.body.pub_sn_1b_tag}.id
        }
     
        pvt_subnet_1b = {
          id   = aws_subnet.${req.body.pvt_sn_1b_tag}.id
        }
     
        internet_gateway = {
          id   = aws_internet_gateway.${req.body.igw_tag}.id
        }
     
        pub_route_table = {
           id   = aws_route_table.${req.body.pub_rt_tag}.id
        }
     
         pvt_route_table = {
           id   = aws_route_table.${req.body.pvt_rt_tag}.id
         }
     
        pub_sg = {
          id   = aws_security_group.${req.body.pub_sg_tag}.id
        }
        load_balancer = {
          id   = aws_lb.${req.body.alb_tag}.id
        }
     
        rds = {
          id   = aws_db_instance.${req.body.db_tag}.id
    }
      }
    }`;
 

    // Write the Terraform configuration to a file
      fs.appendFileSync("/home/dys/project/Backend-Terraform-Nodejs/aws_vpc.tf", tfConfig);
      fs.appendFileSync("/home/dys/project/Backend-Terraform-Nodejs/aws_vpc_output.tf", output);
     // fs.appendFileSync("/home/dys/project/Backend-Terraform-Nodejs/aws_ip_output.tf", outputs);

      //fs.appendFileSync("/home/dys-10156/Videos/DAT/terraform/load_balancer_output.tf",output1);
    }
    // Define the relative path to the Terraform configuration directory
    const configPath = "/home/dys/project/Backend-Terraform-Nodejs";
 
    // Change the current working directory to the Terraform configuration directory
    process.chdir(configPath);
  //   exec(
  //     "terraform apply -auto-approve -parallelism=10",
  //     (applyError, applyStdout, applyStderr) => {
  //       if (applyError) {
  //         console.error("Terraform apply failed:", applyStderr);
  //         return res.status(400).send("Terraform apply failed");
  //       } else {
  //         console.error("Terraform success:", applyStdout);
  //          const resourceIds = [];
  //         // Regular expression pattern to extract resource information
  //         const resourcePattern = /"id"\s*=\s*"([^"]+)"/g;
  //         let matches;
  //         while ((matches = resourcePattern.exec(applyStdout)) !== null) {
  //            const resourceId = matches[1];
 
  //            // Log extracted values
  //            console.log("Resource ID:", resourceId);
 
  //            // Store the resource ID
  //           resourceIds.push(resourceId);
  //          }
  //          console.log("Resource IDs:", resourceIds);
           
  //          let c = [];
  //          let id, ip;  // Declare id and ip variables outside the block
           
  //          const outputPattern = /"ec2"\s*=\s*{\s*"id"\s*=\s*"([^"]+)".*?"ip"\s*=\s*"([^"]+)"/;
  //          const match = applyStdout.match(outputPattern);
           
  //          if (match) {
  //              c = match;
  //              [, id, ip] = match;  // Assign the matched values to id and ip
  //              console.log("ID:", id);
  //              console.log("IP:", ip);
               
  //          } else {
  //              console.log("No match found for id and ip in applyStdout.");
  //              res.send("not match");
  //          }
           
  //          // Now you can use id, ip, and c for further processing if needed
  //          console.log("Matched values:", c);
             
  //         res.status(200).json({
  //           message: "YOUR APPLICATION HAS BEEN DEPLOYED SUCCESSFULLY !!!",
  //           ids:resourceIds,
  //           result: c,
  //           sout:applyStdout
            
  //       }); 
  //       }
  //     }
  //   );
  exec(
    "terraform apply -auto-approve -parallelism=10",
    (applyError, applyStdout, applyStderr) => {
      if (applyError) {
        console.error("Terraform apply failed:", applyStderr);
        return res.status(400).send("Terraform apply failed");
      } else {
        console.log("Terraform success:", applyStdout);
        // Extract resource IDs
        const resourceIds = [];
        const resourcePattern = /"id"\s*=\s*"([^"]+)"/g;
        let matches;
        while ((matches = resourcePattern.exec(applyStdout)) !== null) {
          const resourceId = matches[1];
          resourceIds.push(resourceId);
        }
        console.log("Resource IDs:", resourceIds);

        const ipMatch = applyStdout.match(/"ip" = "(.*?)"/);
        const ipAddress = ipMatch ? ipMatch[1] : null;
         
        console.log(`Extracted IP Address: ${ipAddress}`);
        res.status(200).json({
          message: "YOUR APPLICATION HAS BEEN DEPLOYED SUCCESSFULLY !!!",
          ids: resourceIds,
          result: ipAddress,
          sout: applyStdout,
        });
      }
      });
  } catch (error) {
    console.log("error is:", error);
    res.status(400).send("An error occurred (VPC)");
  }
}

function generateIngressRules(protocols) {
  let ingressRules = '';
 
  protocols.forEach((protocol) => {
    ingressRules += `
  ingress {
    description      = "${protocol} from VPC"
    from_port        = ${
      protocol === "SSH" ? 22 : protocol === "HTTP" ? 80 : protocol === "HTTPS" ? 443 : 0
    }
    to_port          = ${
      protocol === "SSH" ? 22 : protocol === "HTTP" ? 80 : protocol === "HTTPS" ? 443 : 0
    }
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  `;
  });
 
  return ingressRules;
}

//To  create S3 bucket
async function s3_bucket(req, res) {
  try {
      // const tfConfig = `
      //   resource "aws_s3_bucket" "${req.body.bucket_name}" {
      //     bucket = "${req.body.bucket_name}"
      //     # Prevent accidental deletion of this S3 bucket
      //     lifecycle {
      //       prevent_destroy = true
      //     }
      //   }`;
    const bucketname =req.body.bucket_name;
    const tfConfigPath = 'D:/DAT/s3_bucket.tf'
 
    // Check if the Terraform configuration file exists, and create it if not
      if (!fs.existsSync(tfConfigPath)) {
         fs.writeFileSync(tfConfigPath, ''); // Create an empty file
      }
      const tfContent = fs.readFileSync(tfConfigPath, 'utf8');
      if (tfContent.includes(`"${bucketname}"`)) {
      console.log(`S3 with the name "${bucketname}" already exists in the configuration.`);
      return res.status(400).send(`S3 with the name "${bucketname}" already exists in the configuration.`)
    } else{
      const tfConfig =`

        resource "aws_s3_bucket" "${req.body.bucket_name}" {
            bucket =  "${req.body.bucket_name}"
            lifecycle {
                    prevent_destroy = true
                  }
            
          }
            // terraform {
            //     backend "s3" {
            //       bucket         = "${req.body.bucket_name}"
            //       access_key     = "AKIA2TVEYKFLUYXXLOEV"
            //       secret_key     = "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"
            //       key            = "global/s3/terraform.tfstate"
            //       region         = "ap-south-1"
            //       encrypt        =  true
            //       skip_credentials_validation = true
            //     }
            //   }
              `;
      // Write the Terraform configuration to a file
      fs.appendFileSync('D:/DAT/s3_bucket.tf', tfConfig);
          }
      // Define the relative path to the Terraform configuration directory
      const configPath = 'D:/DAT';

      // Change the current working directory to the Terraform configuration directory
      process.chdir(configPath);
      exec('terraform init', (error, initStdout, initStderr) => {
        if (error) {
          console.error('Terraform initialization failed:', initStderr);
          res.status(400).send("Terraform initialization failed");
        } else {
          console.log('Terraform initialization succeeded.');
          exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
            if (applyError) {
              console.error('Terraform apply failed:', applyStderr);
              res.status(400).send("Terraform apply failed");
            } else {
              console.log('Terraform apply succeeded.');
              res.status(200).send("S3 bucket created successfully.");
            }
          });
        }
      });
    }
  catch (error) {
      console.log("error is : ", error)
      res.send("An error occurred (S3 BUCKET)");
  }
}


async function destroy(req, res) {
  try {
    const configPath = 'D:/DAT'; // Path to the directory containing your Terraform configuration file

    // Check if the directory exists
    if (!fs.existsSync(configPath)) {
      console.error(`Directory does not exist: ${configPath}`);
      return res.status(500).json({ message: "Directory does not exist", result: null });
    }

    // Change the current working directory to the Terraform configuration directory
    process.chdir(configPath);
    console.log(req.param.bucket_name);
    // Run Terraform destroy command targeting the specific S3 bucket
    exec('terraform destroy --target=aws_s3_bucket.datayaan-bucket123 ', (destroyError, destroyStdout, destroyStderr) => {
      if (destroyError) {
        console.error('Terraform destroy failed:', destroyStderr);
        return res.status(500).json({ message: 'Terraform destroy failed', result: destroyStderr });
      } else {
        console.log("destroyStdout: ", destroyStdout);
        return res.status(200).json({ message: 'Bucket destroyed successfully', result: destroyStdout });
      }
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Something went wrong", result: error });
  }
}


//To Create SQS-Queue
async function create_queue(req, res){
  try {
      const tfConfig = `
      resource "aws_sqs_queue" "${req.body.queue_name}" {
        name =  "${req.body.queue_name}"
        visibility_timeout_seconds = 30
        delay_seconds             = 30
        max_message_size          = 2048
        message_retention_seconds = 86400
        receive_wait_time_seconds = 10
      }`;

      // Write the Terraform configuration to a file
      fs.appendFileSync('D:/DAT/sqs_queue.tf', tfConfig);
      
      // Define the relative path to the Terraform configuration directory
      const configPath = 'D:/DAT';

      // Change the current working directory to the Terraform configuration directory
      process.chdir(configPath);

      //  Run Terraform commands
      exec('terraform init', (error, initStdout, initStderr) => {
        if (error) {
          console.error('Terraform initialization failed:', initStderr);
          res.status(400).send("Terraform initialization failed");
        } else {
          console.log('Terraform initialization succeeded.');
          exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
            if (applyError) {
              console.error('Terraform apply failed:', applyStderr);
              res.status(400).send("Terraform apply failed");
            } else {
              console.log('Terraform apply succeeded.');
              res.status(200).send("Queue created successfully.");
            }
          });
        }
      });
    }
  catch (error) {
    console.log("error is : ", error)
    res.status(400).send("An error occurred while creating queue");
  }
}


async function create_sns_topic(req, res){
  try {
      const tfConfig = `
      resource "aws_sns_topic" "${req.body.topic_name}" {
        name =  "${req.body.topic_name}"
        display_name = "${req.body.display_name}"
        tags = {
          Name = "${req.body.topic_name}"
        }
      }
      
      resource "aws_sns_topic_subscription" "${req.body.subscription_name}" {
        topic_arn = aws_sns_topic.${req.body.topic_name}.arn
        protocol = "${req.body.protocol}"
        endpoint = "${req.body.endpoint}"
      }`;

      // Write the Terraform configuration to a file
      fs.appendFileSync('D:/DAT/sns_topic.tf', tfConfig);
      
      // Define the relative path to the Terraform configuration directory
      const configPath = 'D:/DAT';

      // Change the current working directory to the Terraform configuration directory
      process.chdir(configPath);

      //  Run Terraform commands
      exec('terraform init', (error, initStdout, initStderr) => {
        if (error) {
          console.error('Terraform initialization failed:', initStderr);
          res.status(400).send("Terraform initialization failed");
        } else {
          console.log('Terraform initialization succeeded.');
          exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
            if (applyError) {
              console.error('Terraform apply failed:', applyStderr);
              res.status(400).send("Terraform apply failed");
            } else {
              console.log('Terraform apply succeeded.');
              res.status(200).send("SNS topic created successfully.");
            }
          });
        }
      });
    }
  catch (error) {
    console.log("error is : ", error)
    res.status(400).send("An error occurred while creating topic");
  }
}

//API for code push to codeCommit
async function push_code(req,res){
  try {

    const repositoryName ="Backend-Terraform-Nodejs";
    const branchName = "master";
    AWS.config.update({ region: 'ap-south-1' });

    // Change to the repository directory
    process.chdir("D:/DAT");

    console.log('Current working directory:', process.cwd());
  //credentials
    USERNAME="Harshu_terraform-at-729416225111"
    PASSWORD="CXP6QRuEQT8NpuOjZhLbpBvYnERPLiZYld8OeUyaJlw="
    //add the code into codecommit
    const addCommand = `git add .`
    execSync(addCommand,{stdio: 'inherit'});

    //commit the code
    const commitCode = `git commit -m "init commit"`
    execSync(commitCode,{stdio: 'inherit'});

    console.log('Code committed successfully.');

    // Post the latest code from CodeCommit
    const pushCommand = `git push https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/Backend-Terraform-Nodejs`;
    execSync(pushCommand, { stdio: 'inherit' });

    res.status(200).send('Code pushed successfully to CodeCommit.');
    
  } catch (error) {
    console.error('Error pushing code from CodeCommit:', error);
    res.status(500).send('Error pushing code from CodeCommit.');
  }
}

//API for code pull from codeCommit
async function code_pull(req,res){
  try {
    const repositoryName ="Backend-Terraform-Nodejs";
    const branchName = "master";
    AWS.config.update({ region: 'ap-south-1' });

    // Clone the CodeCommit repository
     const cloneCommand = `git clone codecommit::ap-south-1://Backend-Terraform-Nodejs`;
    //execSync -> execute Git commands synchronously.
    execSync(cloneCommand, { stdio: 'inherit' });

    // Change to the repository directory
    process.chdir(repositoryName);

    // Pull the latest code from CodeCommit
    const pullCommand = `git pull origin ${branchName}`;
    execSync(pullCommand, { stdio: 'inherit' });

    res.status(200).send('Code pulled successfully from CodeCommit.');
  } catch (error) {
    console.error('Error pulling code from CodeCommit:', error);
    res.status(500).send('Error pulling code from CodeCommit.');
  }
}
//TO CREATE PUBLIC SUBNET 
async function aws_pub_subnet(req, res) {
  try {
      const tfConfig = `
      resource "aws_subnet" "${req.body.sn_name}" {
      vpc_id = "${req.body.vpc_id}"
      cidr_block       = "${req.body.cidr_block}"
      map_public_ip_on_launch = true
      availability_zone = "${req.body.availability_zone}"
      tags = {
        Name = "${req.body.tag_name}"
      }
    }`;

      // Write the Terraform configuration to a file
      fs.appendFileSync('/home/jeya/Music/terraform/pub_subnet.tf', tfConfig);

      // Define the relative path to the Terraform configuration directory
      const configPath = '/home/jeya/Music/terraform';

      // Change the current working directory to the Terraform configuration directory
      process.chdir(configPath);

      // Run Terraform commands

      exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
          if (applyError) {
              console.error('Terraform apply failed:', applyStderr);
              res.send("Terraform apply failed");
          } else {
              console.log('Terraform apply succeeded.');
              console.log(applyStdout);
              res.send("Terraform apply succeeded");
          }
      });
  } catch (error) {
      console.log("error is:", error);
      res.send("An error occurred (PUBLIC SUBNET)");
  }
}

//TO CREATE PRIVATE SUBNET 
async function aws_pvt_subnet(req, res) {
  try {
      const tfConfig = `
      resource "aws_subnet" "${req.body.sn_name}" {
      vpc_id = "${req.body.vpc_id}"
      cidr_block       = "${req.body.cidr_block}"
      availability_zone = "${req.body.availability_zone}"
      tags = {
        Name = "${req.body.tag_name}"
      }
    }`;
      // map_public_ip_on_launch = true (optional for pvt)
      // Write the Terraform configuration to a file
      fs.appendFileSync('/home/jeya/Music/terraform/pvt_subnet.tf', tfConfig);

      // Define the relative path to the Terraform configuration directory
      const configPath = '/home/jeya/Music/terraform';

      // Change the current working directory to the Terraform configuration directory
      process.chdir(configPath);

      // Run Terraform commands

      exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
          if (applyError) {
              console.error('Terraform apply failed:', applyStderr);
              res.send("Terraform apply failed");
          } else {
              console.log('Terraform apply succeeded.');
              console.log(applyStdout);
              res.send("Terraform apply succeeded");
          }
      });

  } catch (error) {
      console.log("error is:", error);
      res.send("An error occurred (PRIVATE SUBNET)");
  }
}

//TO CREATE INTERNET GATEWAY
async function internet_gateway(req, res) {
  try {
      const tfConfig = `
      resource "aws_internet_gateway" "${req.body.ig_name}" {
      vpc_id = "${req.body.vpc_id}"
      tags = {
        Name = "${req.body.tag_name}"
      }
    }`;

      // Write the Terraform configuration to a file
      fs.appendFileSync('/home/jeya/Music/terraform/ig.tf', tfConfig);

      // Define the relative path to the Terraform configuration directory
      const configPath = '/home/jeya/Music/terraform';

      // Change the current working directory to the Terraform configuration directory
      process.chdir(configPath);

      // Run Terraform commands

      exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
          if (applyError) {
              console.error('Terraform apply failed:', applyStderr);
              res.send("Terraform apply failed");
          } else {
              console.log('Terraform apply succeeded.');
              console.log(applyStdout);
              res.send("Terraform apply succeeded");
          }
      });
  }
  catch (error) {
      res.send("An error occurred (INTERNET GATEWAY)");
  }
}

//TO CREATE ROUTE TABLE FOR PUBLIC
async function route_table_pub(req, res) {
  try {
      const tfConfig = `
      resource "aws_route_table" "${req.body.rt_name}" {
      vpc_id = "${req.body.vpc_id}"
      
      route {
        cidr_block = "${req.body.cidr_block}"
        gateway_id = "${req.body.gateway_id}"
      }
    
      tags = {
        Name = "${req.body.tag_name}"
          }
    }`;

      // Write the Terraform configuration to a file
      fs.appendFileSync('/home/jeya/Music/terraform/pub_route_table.tf', tfConfig);

      // Define the relative path to the Terraform configuration directory
      const configPath = '/home/jeya/Music/terraform';

      // Change the current working directory to the Terraform configuration directory
      process.chdir(configPath);

      // Run Terraform commands
      exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
          if (applyError) {
              console.error('Terraform apply failed:', applyStderr);
              res.send("Terraform apply failed");
          } else {
              console.log('Terraform apply succeeded.');
              console.log(applyStdout);
              res.send("Terraform apply succeeded");
          }
      });

  }
  catch (error) {
      console.log("error is : ", error)
      res.send("An error occurred (ROUTE TABLE PUBLIC)");
  }
}


//TO CREATE ROUTE TABLE FOR PRIVATE
async function route_table_pvt(req, res) {
  try {
      const tfConfig = `
      resource "aws_route_table" "${req.body.rt_name}" {
      vpc_id = "${req.body.vpc_id}" 
      tags = {
        Name = "${req.body.tag_name}"
          }
    }`;
      // Write the Terraform configuration to a file
      fs.appendFileSync('/home/jeya/Music/terraform/pvt_route_table.tf', tfConfig);

      // Define the relative path to the Terraform configuration directory
      const configPath = '/home/jeya/Music/terraform';

      // Change the current working directory to the Terraform configuration directory
      process.chdir(configPath);

      // Run Terraform commands
      exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
          if (applyError) {
              console.error('Terraform apply failed:', applyStderr);
              res.send("Terraform apply failed");
          } else {
              console.log('Terraform apply succeeded.');
              console.log(applyStdout);
              res.send("Terraform apply succeeded");
          }
      });

  }
  catch (error) {
      console.log("error is : ", error)
      res.send("An error occurred (ROUTE TABLE PRIVATE)");
  }
}

//ASSOCIATE PUBLIC SUBNET WITH ROUTE TABLE
async function pub_subnet_association(req, res) {
  try {
      const tfConfig = `
      resource "aws_route_table_association" "${req.body.sn_asso_name}" {
          subnet_id      = "${req.body.subnet_id}"
          route_table_id = "${req.body.route_table_id}"
    }`;
      // Write the Terraform configuration to a file
      fs.appendFileSync('/home/jeya/Music/terraform/pub_subnet_association.tf', tfConfig);

      // Define the relative path to the Terraform configuration directory
      const configPath = '/home/jeya/Music/terraform';

      // Change the current working directory to the Terraform configuration directory
      process.chdir(configPath);

      // Run Terraform commands
      exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
          if (applyError) {
              console.error('Terraform apply failed:', applyStderr);
              res.send("Terraform apply failed");
          } else {
              console.log('Terraform apply succeeded.');
              console.log(applyStdout);
              res.send("Terraform apply succeeded");
          }
      });
  }
  catch (error) {
      console.log("error is : ", error)
      res.send("An error occurred (PUBLIC SUBNET ASSOCIATION WITH ROUTE TABLE)");
  }
}

//ASSOCIATE PRIVATE SUBNET WITH ROUTE TABLE
async function pvt_subnet_association(req, res) {
  try {
      const tfConfig = `
      resource "aws_route_table_association" "${req.body.sn_asso_name}" {
          subnet_id      = "${req.body.subnet_id}"
          route_table_id = "${req.body.route_table_id}"
    }`;
      // Write the Terraform configuration to a file
      fs.appendFileSync('/home/jeya/Music/terraform/pvt_subnet_association.tf', tfConfig);

      // Define the relative path to the Terraform configuration directory
      const configPath = '/home/jeya/Music/terraform';

      // Change the current working directory to the Terraform configuration directory
      process.chdir(configPath);

      // Run Terraform commands
      exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
          if (applyError) {
              console.error('Terraform apply failed:', applyStderr);
              res.send("Terraform apply failed");
          } else {
              console.log('Terraform apply succeeded.');
              console.log(applyStdout);
              res.send("Terraform apply succeeded");
          }
      });
  }
  catch (error) {
      console.log("error is : ", error)
      res.send("An error occurred (PRIVATE SUBNET ASSOCIATION WITH ROUTE TABLE)");
  }
}

function generateIngressRules(protocols) {
  let ingressRules = '';

  protocols.forEach((protocol) => {
    ingressRules += `
  ingress {
    description      = "${protocol} from VPC"
    from_port        = ${
      protocol === "SSH" ? 22 : protocol === "HTTP" ? 80 : protocol === "HTTPS" ? 443 : 0
    }
    to_port          = ${
      protocol === "SSH" ? 22 : protocol === "HTTP" ? 80 : protocol === "HTTPS" ? 443 : 0
    }
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  `;
  });

  return ingressRules;
}
//PUBLIC SECURITY GROUP
async function pub_security_group(req, res) {
  try {
      const ingressRules = req.body.ingress.map((rule, index) => `
          ingress {
              from_port       = ${rule.from_port}
              to_port         = ${rule.to_port}
              protocol        = "${rule.protocol}"
              cidr_blocks     = ${JSON.stringify(rule.cidr_blocks)}
              ipv6_cidr_blocks = ${JSON.stringify(rule.ipv6_cidr_blocks)}
          }
      `).join('\n');

      const tfConfig = `
          resource "aws_security_group" "${req.body.sg_name}" {
              name        = "${req.body.name}"
              description = "${req.body.description}"
              vpc_id      = "${req.body.vpc_id}"

              ${ingressRules}

              # Egress Rule Allowing All Outbound Traffic
              egress {
                  from_port   = ${req.body.egress_from_port}
                  to_port     = ${req.body.egress_to_port}
                  protocol    = "${req.body.egress_protocol}"
                  cidr_blocks = ${JSON.stringify(req.body.egress_cidr_blocks)}
                  ipv6_cidr_blocks = ${JSON.stringify(req.body.egress_ipv6_cidr_blocks)}
              }

              tags = {
                  Name = "${req.body.tag_name}"
              }
          }
      `;

      // The rest of your code remains unchanged
      // Write the Terraform configuration to a file
      fs.appendFileSync('/home/jeya/Music/terraform/pub_security_group.tf', tfConfig);

      // Define the relative path to the Terraform configuration directory
      const configPath = '/home/jeya/Music/terraform';

      // Change the current working directory to the Terraform configuration directory
      process.chdir(configPath);

      // Run Terraform commands
      exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
          if (applyError) {
              console.error('Terraform apply failed:', applyStderr);
              res.send("Terraform apply failed");
          } else {
              console.log('Terraform apply succeeded.');
              console.log(applyStdout);
              res.send("Terraform apply succeeded");
          }
      });

  } catch (error) {
      console.log("error is : ", error);
      res.send("An error occurred (PUBLIC SECURITY GROUP)");
  }
}

//PRIVATE SECURITY GROUP
async function pvt_security_group(req, res) {
  try {
      const ingressRules = req.body.ingress.map((rule, index) => `
          ingress {
              from_port       = ${rule.from_port}
              to_port         = ${rule.to_port}
              protocol        = "${rule.protocol}"
              cidr_blocks     = ${JSON.stringify(rule.cidr_blocks)}
              ipv6_cidr_blocks = ${JSON.stringify(rule.ipv6_cidr_blocks)}
          }
      `).join('\n');

      const tfConfig = `
          resource "aws_security_group" "${req.body.sg_name}" {
              name        = "${req.body.name}"
              description = "${req.body.description}"
              vpc_id      = "${req.body.vpc_id}"

              ${ingressRules}

              # Egress Rule Allowing All Outbound Traffic
              egress {
                  from_port   = ${req.body.egress_from_port}
                  to_port     = ${req.body.egress_to_port}
                  protocol    = "${req.body.egress_protocol}"
                  cidr_blocks = ${JSON.stringify(req.body.egress_cidr_blocks)}
                  ipv6_cidr_blocks = ${JSON.stringify(req.body.egress_ipv6_cidr_blocks)}
              }

              tags = {
                  Name = "${req.body.tag_name}"
              }
          }
      `;

      // The rest of your code remains unchanged
      // Write the Terraform configuration to a file
      fs.appendFileSync('/home/jeya/Music/terraform/pvt_security_group.tf', tfConfig);

      // Define the relative path to the Terraform configuration directory
      const configPath = '/home/jeya/Music/terraform';

      // Change the current working directory to the Terraform configuration directory
      process.chdir(configPath);

      // Run Terraform commands
      exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
          if (applyError) {
              console.error('Terraform apply failed:', applyStderr);
              res.send("Terraform apply failed");
          } else {
              console.log('Terraform apply succeeded.');
              console.log(applyStdout);
              res.send("Terraform apply succeeded");
          }
      });

  } catch (error) {
      console.log("error is : ", error);
      res.send("An error occurred (PRIVATE SECURITY GROUP)");
  }
}
async function aws_vpc(req, res) {
  try {
      const tfConfig = `
resource "aws_vpc" "${req.body.vpc_name}" {
cidr_block       = "${req.body.cidr_block}"
instance_tenancy = "${req.body.instance_tenancy}"
tags = {
  Name = "${req.body.tag_name}"
}
}`;
      // Write the Terraform configuration to a file
      fs.appendFileSync('/home/jeya/Music/terraform/vpc.tf', tfConfig);

      // Define the relative path to the Terraform configuration directory
      const configPath = '/home/jeya/Music/terraform';

      // Change the current working directory to the Terraform configuration directory
      process.chdir(configPath);

      // Run Terraform commands
      exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
          if (applyError) {
              console.error('Terraform apply failed:', applyStderr);
              res.send("Terraform apply failed");
          } else {
              console.log('Terraform apply succeeded.');
              console.log(applyStdout);
              res.send("Terraform apply succeeded");
          }
      });
  } catch (error) {
      console.log("error is:", error);
      res.send("An error occurred(VPC)");
  }
}

async function launch_template(req, res) {
  try {
    const tagName = req.body.tagname;
    const tfConfigPath = '/home/jeya/Videos/DAT_v1/launch_template.tf'

    // Check if the Terraform configuration file exists, and create it if not
if (!fs.existsSync(tfConfigPath)) {
  fs.writeFileSync(tfConfigPath, ''); // Create an empty file
}
const tfContent = fs.readFileSync(tfConfigPath, 'utf8');
    if (tfContent.includes(`"${tagName}"`)) {
      console.log(`Launch Template with the name "${tagName}" already exists in the configuration.`);
      return res.status(400).send(`Launch Template with the name "${tagName}" already exists in the configuration.`)
    } else {
    const tfConfig = `
    resource "aws_launch_template" "${req.body.tagname}" {
      name_prefix   = "${req.body.tagname}"
      image_id      = "${req.body.image_id}"
      instance_type = "${req.body.instance_type}"

      lifecycle {
        create_before_destroy = true
      }
    }`;
    // Write the Terraform configuration to a file
    fs.appendFileSync("/home/jeya/Videos/DAT_v1/launch_template.tf", tfConfig);
  }
    // Define the relative path to the Terraform configuration directory
    const configPath = "/home/jeya/Videos/DAT_v1";

    // Change the current working directory to the Terraform configuration directory
    process.chdir(configPath);

    // Run Terraform commands

    exec(
      "terraform apply -auto-approve",
      (applyError, applyStdout, applyStderr) => {
        if (applyError) {
          console.error("Terraform apply failed:", applyStderr);
          res.send("Terraform apply failed");
        } else {
          console.log("Terraform apply succeeded.");
          // console.log(applyStdout);
          res.status(200).json({ message: "Launch Template created successfully",});
        }
      }
    );
  } catch (error) {
    const response = {
      error: error.message,
    };
    res.status(500).json(response);
  }
}

async function ami_instance(req, res) {
  try {
    const tagName = req.body.tagname;
    const tfConfigPath = '/home/jeya/Videos/DAT_v1/ami_instance.tf'

    // Check if the Terraform configuration file exists, and create it if not
if (!fs.existsSync(tfConfigPath)) {
  fs.writeFileSync(tfConfigPath, ''); // Create an empty file
}
const tfContent = fs.readFileSync(tfConfigPath, 'utf8');
    if (tfContent.includes(`"${tagName}"`)) {
      console.log(`AMI instance with the name "${tagName}" already exists in the configuration.`);
      return res.status(400).send(`AMI instance with the name "${tagName}" already exists in the configuration.`)
    } else {
    const tfConfig = `
    resource "aws_ami_from_instance" "${req.body.tagname}" {
      name               = "${req.body.tagname}"
      source_instance_id = "${req.body.instance_id}"
    }`;
    // Write the Terraform configuration to a file
    fs.appendFileSync("/home/jeya/Videos/DAT_v1/ami_instance.tf", tfConfig);
  }
    // Define the relative path to the Terraform configuration directory
    const configPath = "/home/jeya/Videos/DAT_v1";

    // Change the current working directory to the Terraform configuration directory
    process.chdir(configPath);

    // Run Terraform commands

    exec(
      "terraform apply -auto-approve",
      (applyError, applyStdout, applyStderr) => {
        if (applyError) {
          console.error("Terraform apply failed:", applyStderr);
          res.send("Terraform apply failed");
        } else {
          console.log("Terraform apply succeeded.");
          // console.log(applyStdout);
          res.status(200).json({ message: "AMI instance image created successfully",});
        }
      }
    );
  } catch (error) {
    const response = {
      error: error.message,
    };
    res.status(500).json(response);
  }
}

// "key": "demo_key",
// "value": "demo_value",
// "propagate_at_launch": true,
async function  ASG(req, res) {
  try {
    const tagName = req.body.tagname;
    const tfConfigPath = '/home/jeya/Videos/DAT_v1/ASG.tf'

// Check if the Terraform configuration file exists, and create it if not
if (!fs.existsSync(tfConfigPath)) {
  fs.writeFileSync(tfConfigPath, ''); // Create an empty file
}
const tfContent = fs.readFileSync(tfConfigPath, 'utf8');
    if (tfContent.includes(`"${tagName}"`)) {
      console.log(`ASG with the name "${tagName}" already exists in the configuration.`);
      return res.status(400).send(`ASG with the name "${tagName}" already exists in the configuration.`)
    } else {
    const tfConfig = ` 
    resource "aws_autoscaling_group" "${req.body.tagname}" {
      name                      = "${req.body.tagname}"
      max_size                  = ${req.body.max_size}
      min_size                  = ${req.body.min_size}
      health_check_grace_period = ${req.body.health_check_grace_period}
      health_check_type         = "${req.body.health_check_type}"
      desired_capacity          = ${req.body.desired_capacity}
      force_delete              = ${req.body.force_delete}
      vpc_zone_identifier = ${JSON.stringify(req.body.vpc_zone_identifier)}
     
      launch_template {
        id      = "${req.body.launch_template_id}"
        version = "$Latest"
      }

      instance_maintenance_policy {
        min_healthy_percentage = ${req.body.min_healthy_percentage}
        max_healthy_percentage = ${req.body.max_healthy_percentage}
      }
    
      initial_lifecycle_hook {
        name                 = "${req.body.hook_name}"
        default_result       = "CONTINUE"
        heartbeat_timeout    = ${req.body.heartbeat_timeout}
        lifecycle_transition = "${req.body.lifecycle_transition}"
        // notification_metadata = jsonencode({
        //   foo = "bar"
        // })
    
        // notification_target_arn = "arn:aws:sqs:us-east-1:444455556666:queue1*"
        // role_arn                = "arn:aws:iam::123456789012:role/S3Access"
      }
    
      // tag {
      //   key                 = "${req.body.key}"
      //   value               = "${req.body.value}"
      //   propagate_at_launch = "${req.body.propagate_at_launch}"
      // }
    
      timeouts {
        delete = "${req.body.timeouts}"
      }
   }
    # Define Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  name                  = "scale-up-policy"
  scaling_adjustment    = ${req.body.scaling_adjustment}
  adjustment_type       = "${req.body.adjustment_type}"
  cooldown              = ${req.body.cooldown}  # 5 minutes cooldown
  //cooldown_action       = "ABANDON"
  autoscaling_group_name = aws_autoscaling_group.${req.body.tagname}.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "scale-down-policy"
  scaling_adjustment    = ${req.body.scaling_adjustment}
  adjustment_type       = "${req.body.adjustment_type}"
  cooldown              = ${req.body.cooldown}
  //cooldown_action       = "ABANDON"
  autoscaling_group_name = aws_autoscaling_group.${req.body.tagname}.name
}`;
    // Write the Terraform configuration to a file
    fs.appendFileSync("/home/jeya/Videos/DAT_v1/ASG.tf", tfConfig);
    }
    // Define the relative path to the Terraform configuration directory
    const configPath = "/home/jeya/Videos/DAT_v1";

    // Change the current working directory to the Terraform configuration directory
    process.chdir(configPath);

    // Run Terraform commands

    exec(
      "terraform apply -auto-approve",
      (applyError, applyStdout, applyStderr) => {
        if (applyError) {
          console.error("Terraform apply failed:", applyStderr);
          res.send("Terraform apply failed");
        } else {
          console.log("Terraform apply succeeded.");
          console.log(applyStdout);
          res.status(200).json({ message: "autoscaling group created successfully",});
        }
      }
    );
  } catch (error) {
    const response = {
      error: error.message,
    };
    res.status(500).json(response);
  }
}

// async function jenkin(req, res) {
//   try {
//     const credentials = new AWS.Credentials({
//       accessKeyId: 'AKIA2TVEYKFLUYXXLOEV',
//       secretAccessKey: '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',
//     });

//     AWS.config.update({
//       credentials,
//       region: 'ap-south-1',
//     });

//     const codecommit = new AWS.CodeCommit();
//     const repoPath = "https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/datayaan_website2.0"; // Change this to the local directory where you want to clone the repository
//     const repoName = 'datayaan_website2.0';

//     const gitCredentials = {
//       username: 'Harshu_terraform-at-729416225111',
//       password: 'CXP6QRuEQT8NpuOjZhLbpBvYnERPLiZYld8OeUyaJlw=',
//     };
//     const params = {
//       repositoryName: repoName,
//     };
    

//     // Print the type of repoPath to the console
//     console.log('Type of repoPath:', typeof repoPath);
//     const { cloneUrlHttp } = await codecommit.getRepository(params).promise();
//     const repoUrl = cloneUrlHttp;

//      if (typeof repoPath !== 'string') {
//       throw new Error('Invalid repoPath. Expected a string.');
//     }

//     // Ensure the directory path is correctly formatted
//     const repoDir = path.resolve(repoPath);

//     // Use promisify to convert fs.mkdir to a promise-based version
//     const mkdirAsync = promisify(fs.mkdir);

//     // Create the directory with recursive set to true
//     await mkdirAsync(repoDir, { recursive: true });

//     // Include username and password for Git authentication
//     const git = simpleGit(repoPath);
//     await git.outputHandler((command, stdout, stderr) => {
//       stdout.on('data', (data) => console.log(data.trim()));
//       stderr.on('data', (data) => console.error(data.trim()));
//     }).clone(
//       repoUrl,
//       repoPath,
//       [
//         '--config',
//         `credential.${repoUrl}.helper=!f() { echo "username=${gitCredentials.username}"; echo "password=${gitCredentials.password}"; }; f`,
//       ]
//     );

//     console.log('Repository cloned successfully.');

//     // Continue to the next step (modify Jenkins file)
//     await modifyJenkinsFile(req, res, repoPath);
//   } catch (error) {
//     console.error('Error in jenkin:', error);
//     res.status(500).send('Internal Server Error');
//   }
// }

// async function modifyJenkinsFile(req, res, repoPath) {
//   const jenkinsFilePath = `${repoPath}/Jenkinsfile`;

//   try {
//     const data = await fs.readFile(jenkinsFilePath, 'utf8');

//     // Modify the Jenkins file content (add IP address)
//     const modifiedData = data.replace(/NGINX_SERVER/g, req.body.ipAddress);

//     // Write the modified content back to the Jenkins file
//     await fs.writeFile(jenkinsFilePath, modifiedData);

//     console.log('Jenkins file modified successfully.');

//     // Commit and push changes to the remote repository
//     await commitAndPushChanges(repoPath, req, res);
//   } catch (readErr) {
//     console.error('Error reading Jenkins file:', readErr);
//     res.status(500).send('Internal Server Error');
//   }
// }

// async function commitAndPushChanges(repoPath, req, res) {
//   console.log("empty: ",repoPath)
//   const git = simpleGit(repoPath);

//   try {
//     await git.add('.');
//     await git.commit('Update NGINX_SERVER IP address');
//     await git.push('origin', 'main');

//     console.log('Changes pushed to the repository.');
//     // Continue to the next step (e.g., trigger Jenkins build)

//     // In this example, triggering a Jenkins build is not implemented.
//     // You can add the logic here to trigger the Jenkins build.
//     res.status(200).send('Jenkins file modified and changes pushed successfully.');
//   } catch (pushErr) {
//     console.error('Error pushing changes:', pushErr);
//     res.status(500).send('Internal Server Error');
//   }
// }

// // Check if a directory exists
// async function directoryExists(path) {
//   try {
//     await fs.access(path);
//     return true;
//   } catch {
//     return false;
//   }
// }

async function architecture(req, res) {
  try {
    let tfConfig = '';

    if ('vpc' in req.body && Array.isArray(req.body.vpc)) {
      const objects = JSON.stringify(req.body.vpc)
      tfConfig += architec.vpc(objects);
    }
    
    if ('subnet' in req.body && Array.isArray(req.body.subnet)) {
      const objects = JSON.stringify(req.body.subnet)
      tfConfig += architec.subnet(objects);
    }
    if ('internet_gateway' in req.body && Array.isArray(req.body.internet_gateway)) {
      const objects = JSON.stringify(req.body.internet_gateway)
      tfConfig += architec.internet_gateway(objects);
    }
    if ('public_rt' in req.body && Array.isArray(req.body.public_rt)) {
      const objects = JSON.stringify(req.body.public_rt)
      tfConfig += architec.public_route_table(objects);
    }
    if ('private_rt' in req.body && Array.isArray(req.body.private_rt)) {
      const objects = JSON.stringify(req.body.private_rt)
      tfConfig += architec.private_route_table(objects);
    }
    
    if ('security_group' in req.body && Array.isArray(req.body.security_group)) {
      const objects = JSON.stringify(req.body.security_group)
      tfConfig += architec.security_group(objects);
    }

    if ('instance' in req.body && Array.isArray(req.body.instance)) {
      const objects = JSON.stringify(req.body.instance)
      tfConfig += architec.instance(objects);
    }
    if ('load_balancer' in req.body && Array.isArray(req.body.load_balancer)) {
      const objects = JSON.stringify(req.body.load_balancer)
      tfConfig += architec.load_balancer(objects);
    }
    if ('rds' in req.body && Array.isArray(rds.load_balancer)) {
      const objects = JSON.stringify(rds.load_balancer)
      tfConfig += architec.rds(objects);
    }

    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().replace(/[:.]/g, '-');

    const fileName = `/home/dys/project/Backend-Terraform-Nodejs/aws_vpc_${formattedDate}.tf`;
    fs.appendFileSync(fileName, tfConfig);
    // fs.appendFileSync("/home/dys-10156/Videos/DAT/terraform/aws_vpc_output.tf", output);

    // Define the relative path to the Terraform configuration directory
    const configPath = "/home/dys/project/Backend-Terraform-Nodejs";
 
    // Change the current working directory to the Terraform configuration directory
    process.chdir(configPath);
    exec(
      "terraform apply -auto-approve -parallelism=10",
      (applyError, applyStdout, applyStderr) => {
        if (applyError) {
          console.error("Terraform apply failed:", applyStderr);
          return res.status(400).send("Terraform apply failed");
        } else {
          console.error("Terraform success:", applyStdout);
          const resourceIds = parseResourceIds(applyStdout);
          res.status(200).json({
            message: "YOUR APPLICATION HAS BEEN DEPLOYED SUCCESSFULLY !!!",
            ids: resourceIds,
            result: ipAddress,
          });
        }
      }
    );
  }
  catch (error) {
    console.log("error is:", error);
    res.status(400).send("An error occurred (VPC)");
  }
}

function parseResourceIds(applyStdout) {
  const resourceIds = {};
  const resourceId = [];
        const resourcePattern = /"id"\s*=\s*"([^"]+)"/g;
        let matches;
        while ((matches = resourcePattern.exec(applyStdout)) !== null) {
          const resourceId = matches[1];
          resourceIds.push(resourceId);
        }
        console.log("Resource IDs:", resourceIds);

        const ipMatch = applyStdout.match(/"ip" = "(.*?)"/);
        const ipAddress = ipMatch ? ipMatch[1] : null;
         
        console.log(`Extracted IP Address: ${ipAddress}`);
  
     resourceIds = {resourceId , ipAddress}
  return resourceIds;
}


async function  rosa(req, res) {
  try {
    const tagName = "demo-1234";
    const tfConfigPath = '/home/jeya/Pictures/Backend-Terraform-Nodejs/rosa.tf'

// Check if the Terraform configuration file exists, and create it if not
if (!fs.existsSync(tfConfigPath)) {
  fs.writeFileSync(tfConfigPath, ''); // Create an empty file
}
const tfContent = fs.readFileSync(tfConfigPath, 'utf8');
    if (tfContent.includes(`"${tagName}"`)) {
      console.log(`rosa with the name "${tagName}" already exists in the configuration.`);
      return res.status(400).send(`ASG with the name "${tagName}" already exists in the configuration.`)
    } else {
    const tfConfig = `
          // provider "aws" {
          //   access_key = "AKIA2TVEYKFL66QXICEW"
          //   secret_key = "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"
          //   region     = "ap-south-1"
          // }

          terraform {
          required_providers {
            aws = {
              source  = "hashicorp/aws"
              version = ">= 4.20.0"
            }
            rhcs = {
              version = "1.4.0"
              source  = "terraform-redhat/rhcs"
            }
          }
          }
          provider "rhcs" {
          token = var.token
          url   = var.url
          }

          data "rhcs_policies" "all_policies" {}

          data "rhcs_versions" "all" {}

          module "create_account_roles" {
            source  = "terraform-redhat/rosa-sts/aws"
            version = "0.0.15"

            create_operator_roles = false
            create_oidc_provider  = false
            create_account_roles  = true

            account_role_prefix    = var.account_role_prefix
            rosa_openshift_version = var.openshift_version
            account_role_policies  = data.rhcs_policies.all_policies.account_role_policies
            operator_role_policies = data.rhcs_policies.all_policies.operator_role_policies
            all_versions           = data.rhcs_versions.all
            path                   = var.path
            tags                   = var.tags

          }
          data "aws_caller_identity" "current" {
          } 


          resource "rhcs_cluster_rosa_classic" "rosa_sts_cluster" {
          name                = var.cluster_name
          cloud_region        = var.cloud_region
          aws_account_id = "729416225111"
          #   aws_account_id      = data.aws_caller_identity.current.account_id
          availability_zones  = var.availability_zones
          replicas            = var.replicas
          autoscaling_enabled = var.autoscaling_enabled
          min_replicas        = var.min_replicas
          max_replicas        = var.max_replicas
          # version             = var.openshift_version
          properties = {
            rosa_creator_arn = data.aws_caller_identity.current.arn
          }

          sts = local.sts_roles
          wait_for_create_complete = true
          }


          locals {
          path = coalesce(var.path, "/")
          sts_roles = {
          aws_access_key_id     = "AKIA2TVEYKFL66QXICEW"    
          aws_secret_access_key = "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"
          token                 = var.token
          url                   = var.url
          role_arn         = "arn:aws:iam::729416225111:role/account-role-blmo-Installer-Role",
          support_role_arn = "arn:aws:iam::729416225111:role/account-role-blmo-Support-Role",
            instance_iam_roles = {
              master_role_arn = "arn:aws:iam::729416225111:role/account-role-blmo-ControlPlane-Role",
              worker_role_arn = "arn:aws:iam::729416225111:role/account-role-blmo-Worker-Role"
            },
            operator_role_prefix = "dat-1",
            oidc_config_id       = module.oidc_config.id
          }
          }

          module "oidc_config" {
          token                = var.token
          url                  = var.url
          source               = "./oidc_provider"
          managed              = false
          installer_role_arn   = "arn:aws:iam::729416225111:role/account-role-blmo-Installer-Role"
          operator_role_prefix = var.operator_role_prefix
          account_role_prefix  = var.account_role_prefix
          cloud_region         = var.cloud_region
          tags                 = var.tags
          path                 = var.path

          }
    `
    const variable_rosa = `  variable "openshift_version" {
      type = string
      default = "4.13"
      description = "Enter the desired OpenShift version as X.Y. This version should match what you intend for your ROSA cluster. For example, if you plan to create a ROSA cluster using '4.13.10', then this version should be '4.13'. You can see the supported versions of OpenShift by running 'rosa list version'."
    }
  
    variable "account_role_prefix" {
      type    = string
      default = "dat-1"
      description = "Your account roles are prepended with whatever value you enter here. The default value in the ROSA CLI is 'ManagedOpenshift-' before all of your account roles."
    }
  
    variable "tags" { 
      type        = map
      default     = null
      description = "(Optional) List of AWS resource tags to apply."
    }
  
    variable "token" {
    type = string
    default = "eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJhZDUyMjdhMy1iY2ZkLTRjZjAtYTdiNi0zOTk4MzVhMDg1NjYifQ.eyJpYXQiOjE3MDIwMjAwNjIsImp0aSI6IjA4MWM5NjI4LTNmZDktNGU1Yi05NjJiLTJhNTY1NzNjZDBjZCIsImlzcyI6Imh0dHBzOi8vc3NvLnJlZGhhdC5jb20vYXV0aC9yZWFsbXMvcmVkaGF0LWV4dGVybmFsIiwiYXVkIjoiaHR0cHM6Ly9zc28ucmVkaGF0LmNvbS9hdXRoL3JlYWxtcy9yZWRoYXQtZXh0ZXJuYWwiLCJzdWIiOiJmOjUyOGQ3NmZmLWY3MDgtNDNlZC04Y2Q1LWZlMTZmNGZlMGNlNjpoYXJzaHVzYW5qdSIsInR5cCI6Ik9mZmxpbmUiLCJhenAiOiJjbG91ZC1zZXJ2aWNlcyIsIm5vbmNlIjoiYTI4MGYxYmYtNGNhZi00NGM0LWJkNjItNGY1NGQwMjMyODI1Iiwic2Vzc2lvbl9zdGF0ZSI6Ijg5MDE4NWQzLTZiZWEtNGE0NS1hMWExLTFmZDUxNThkMDUzZiIsInNjb3BlIjoib3BlbmlkIGFwaS5pYW0uc2VydmljZV9hY2NvdW50cyBvZmZsaW5lX2FjY2VzcyIsInNpZCI6Ijg5MDE4NWQzLTZiZWEtNGE0NS1hMWExLTFmZDUxNThkMDUzZiJ9.eyUglzRpjU2dzALWFt5W-Gtggc5RgyodGYmBc5Bj02A"
  }
  
  variable "url" {
    type        = string
    description = "Provide OCM environment by setting a value to url"
    default     = "https://api.openshift.com"
  }
  
  variable "path" {
    description = "(Optional) The arn path for the account/operator roles as well as their policies."
    type        = string
    default     = null
  }
  
  variable "cluster_name" {
    type    = string
    default = "demo-1234"
  }
  
  variable "cloud_region" {
    type    = string
    default = "ap-south-1"
  }
  
  variable "availability_zones" {
    type    = list(string)
    default = ["ap-south-1a"]
  }
  
  variable "operator_role_prefix" {
    type = string
    default = "dat-1"
    # validation {
    #   condition     = can(regex("^[\\w+=,.@-]+$", var.operator_role_prefix)) || length(var.operator_role_prefix) == 0
    #   error_message = "Invalid operator_role_prefix. It should match the pattern ^[\\w+=,.@-]+$ or be an empty string."
    # }
  }
  
  variable "installer_role_arn" {
    description = "STS Role ARN with get secrets permission, relevant only for unmanaged OIDC config"
    type        = string
    default     = "arn:aws:iam::729416225111:role/account-role-blmo-Installer-Role"
  }
  
  variable "replicas" {
    description = "The amount of the machine created in this machine pool."
    type        = number
    default     = 2
  }
  
  variable "autoscaling_enabled" {
    description = ""
    type        = string
    default     = "false"
  }
  
  variable "min_replicas" {
    description = "The minimum number of replicas for autoscaling."
    type        = number
    default     = null
  }
  
  variable "max_replicas" {
    description = "The maximum number of replicas not exceeded by the autoscaling functionality."
    type        = number
    default     = null
  }`;

  const ouput_rosa = `
  output "oidc_endpoint_url" {
    value = module.oidc_config.oidc_endpoint_url
  }
  
  output "thumbprint" {
    value = module.oidc_config.thumbprint
  }
  
  
  output "cluster_id" {
    value = rhcs_cluster_rosa_classic.rosa_sts_cluster.id
  }
  
  output "account_role_prefix" {
    value = module.create_account_roles.account_role_prefix
  }`;
    // Write the Terraform configuration to a file
    fs.appendFileSync("/home/jeya/Pictures/Backend-Terraform-Nodejs/rosa.tf", tfConfig);
    fs.appendFileSync("/home/jeya/Pictures/Backend-Terraform-Nodejs/variable_rosa.tf", variable_rosa);
    fs.appendFileSync("/home/jeya/Pictures/Backend-Terraform-Nodejs/ouput_rosa.tf", ouput_rosa);
    }
    // Define the relative path to the Terraform configuration directory
    const configPath = "/home/jeya/Pictures/Backend-Terraform-Nodejs";

    // Change the current working directory to the Terraform configuration directory
    process.chdir(configPath);

    // Run Terraform commands
    exec('terraform init', (error, initStdout, initStderr) => {
      if (error) {
        console.error('Terraform initialization failed:', initStderr);
        res.status(400).send("Terraform initialization failed");
      } else {
        console.log('Terraform initialization succeeded.');
        exec('terraform apply -auto-approve', (applyError, applyStdout, applyStderr) => {
          if (applyError) {
            console.error('Terraform apply failed:', applyStderr);
            res.status(400).send("Terraform apply failed");
          } else {
            console.log('Terraform apply succeeded.');
            res.status(200).send("cluster created successfully.");
          }
        });
      }
    });
  } catch (error) {
    const response = {
      error: error.message,
    };
    res.status(500).json(response);
  }
}

module.exports = {
  aws_login,
  static_vpc,
  aws_vpc,
  vpc_archi,
  // dynamic_vpc,
  ec2_instance,
  security_group_list,
  subnet_list,
  os_list,
  vpc_list,
  s3_bucket,
  destroy,
  create_queue,
  create_sns_topic,
  code_pull,
  push_code, 
  aws_pub_subnet,
  aws_pvt_subnet,
  internet_gateway,
  pub_subnet_association,
  pvt_subnet_association,
  route_table_pub,
  route_table_pvt,
  pub_security_group,
  pvt_security_group,
  launch_template,
  ami_instance,
  ASG,
  architecture,
  rosa
  // jenkin,
};

// async function dynamic_vpc(req, res) {
//   try {
//     const vpcName = "demo_vpc";
//     const tfConfigPath = 'D:/DAT/aws_vpc.tf'
 
//     // Check if the Terraform configuration file exists, and create it if not
//   if (!fs.existsSync(tfConfigPath)) {
//     fs.writeFileSync(tfConfigPath, ''); // Create an empty file
//   }
// const tfContent = fs.readFileSync(tfConfigPath, 'utf8');
//     if (tfContent.includes(`"${vpcName}"`)) {
//       console.log(`VPC with the name "${vpcName}" already exists in the configuration.`);
//       return res.status(400).send(`VPC with the name "${vpcName}" already exists in the configuration.`)
//     } else {
//       const subnetResources = req.body.subnet.map((subnet) => `
//       resource "aws_subnet" "${subnet.tag}" {
//           vpc_id     = aws_vpc.${req.body.vpc_tag}.id
//           cidr_block = "${subnet.cidr}"
//           availability_zone = "${subnet.az}"
//           map_public_ip_on_launch = true
//           tags = {
//               Name = "${subnet.tag}"
//           }
//       }
//       `).join('');

//       const routeTableAssociationResources = req.body.association.map(assoc => `
//   resource "aws_route_table_association" "assoc_${assoc.rt_id}_${assoc.subnet_id}" {
//     subnet_id      = aws_subnet.${assoc.subnet_id}.id
//     route_table_id = aws_route_table.${assoc.rt_id}.id
//   }
// `).join('');
 
//       const generateSecurityGroupIngressRules = (protocols) => {
//         return protocols.map(protocol => `
//             ingress {
//                 from_port   = ${protocol === "SSH" ? 22 : protocol === "HTTP" ? 80 : protocol === "HTTPS" ? 443 : 0}
//                 to_port     = ${protocol === "SSH" ? 22 : protocol === "HTTP" ? 80 : protocol === "HTTPS" ? 443 : 0 }
//                 protocol    = "tcp"
//                 cidr_blocks = ["0.0.0.0/0"]
//                 ipv6_cidr_blocks = ["::/0"]
//             }
//         `).join('');
//     };
   
//     const securityGroupResources = req.body.sg.map(sg => `
//     resource "aws_security_group" "${sg.tag}" {
//         name        = "${sg.tag}"
//         description = "Allow inbound traffic"
//         vpc_id      = aws_vpc.${req.body.vpc_tag}.id
//         ${generateSecurityGroupIngressRules(sg.protocol)}
//         egress {
//             from_port        = 0
//             to_port          = 0
//             protocol         = "-1"
//             cidr_blocks      = ["0.0.0.0/0"]
//             ipv6_cidr_blocks = ["::/0"]
//         }
 
//         tags = {
//             Name = "${sg.tag}"
//         }
//     }
// `).join('');
 
//      // const ingressRules = generateIngressRules(req.body.protocol);
//     let result = myFunction(req.body.ami)
//     let tfConfig='';
//     if (req.body.vpc_tag) {
//     tfConfig = `
//     resource "aws_vpc" "${req.body.vpc_tag}" {
//       cidr_block       = "${req.body.vpc_cidr}"
//       instance_tenancy = "default"
//       tags = {
//         Name = "${req.body.vpc_tag}"
//       }
//     }`
 
//     if(req.body.subnet){
//     tfConfig += `${subnetResources}`;
// }
   
//     if(req.body.igw_tag) {
//   tfConfig += `
//   resource "aws_internet_gateway" "${req.body.igw_tag}" {
//     vpc_id = aws_vpc.${req.body.vpc_tag}.id
//     tags = {
//       Name = "${req.body.igw_tag}"
//     }
//   }
 
//   `;
// }
//  if(req.body.pub_rt_tag){
//     //4 public route table
//     tfConfig += `resource "aws_route_table" "${req.body.pub_rt_tag}" {
//     vpc_id = aws_vpc.${req.body.vpc_tag}.id
//     route {
//       cidr_block = "0.0.0.0/0"
//       gateway_id = aws_internet_gateway.${req.body.igw_tag}.id
//     }
   
//     tags = {
//       Name = "${req.body.pub_rt_tag}"
//     }
//   }
 
//   `
// }
//    if(req.body.pvt_rt_tag){
//   //5 route table for private
//   tfConfig += `resource "aws_route_table" "${req.body.pvt_rt_tag}" {
//     vpc_id = aws_vpc.${req.body.vpc_tag}.id
//     tags = {
//       Name = "${req.body.pvt_rt_tag}"
//     }
//   }
//  `
// }
 
// if(req.body.association){
//   //associate public subnet with route table
//  tfConfig +=  `${routeTableAssociationResources}`
// }
//    if(req.body.sg){
//    tfConfig += `${securityGroupResources}`
//    }


//  if(req.body.instance_tag){
//     // ec2 instance
//     tfConfig +=`resource "aws_instance" "${req.body.instance_tag}" {
//       ami           = "${result}"
//       instance_type = "${req.body.instance_type}"
//       associate_public_ip_address = true
//       subnet_id     = aws_subnet.demo_pub_sn_1a.id
//       vpc_security_group_ids = [aws_security_group.demo_sg_1.id]
   
//       user_data = <<-EOF
//                   #!/bin/bash
//                   apt-get update
//                   apt-get install -y ${req.body.server}
//                   sudo systemctl enable ${req.body.server}
//                   sudo systemctl start ${req.body.server}    
//                   cd /var/www/html
//                   sudo chmod -R 777 .
//                   git init
//                   USERNAME="Harshu_terraform-at-729416225111"
//                   PASSWORD="CXP6QRuEQT8NpuOjZhLbpBvYnERPLiZYld8OeUyaJlw="
//                   git clone https://$USERNAME:$PASSWORD@git-codecommit.ap-south-1.amazonaws.com/v1/repos/datayaan_website2.0"
//                   cd /var/www/html/datayaan_website2.0
//                   mv /var/www/html/datayaan_website2.0/* /var/www/html
//                   cd /var/www/html
//                   rm -rf datayaan_website2.0
//                   rm -rf index.nginx-debian.html                      
//                   EOF
//     //   tags = {
//     //     Name = "demo_nginx"
//     // }
//     }
   
//     `
//   }
 
//    if(req.body.alb_tag){
// //load balancer:
// tfConfig += `resource "aws_lb" "${req.body.alb_tag}" {
//   name               = "${req.body.alb_tag}"
//   internal           = false
//   load_balancer_type = "application"
//   //security_groups    = ["${req.body.alb_security_group}"]                                
// // subnets            = ${JSON.stringify(req.body.alb_subnet_id)}
//   security_groups = [aws_security_group.demo_sg_1.id]
//   subnets =[aws_subnet.demo_pub_sn_1a.id,aws_subnet.demo_pub_sn_1b.id]
 
//   enable_deletion_protection = false
 
//   enable_http2                     = true
//   idle_timeout                     = 60
//   enable_cross_zone_load_balancing = true
// }
 
// resource "aws_lb_listener" "my-listener" {
//   load_balancer_arn = aws_lb.${req.body.alb_tag}.arn
//   port              = 80
//   protocol          = "HTTP"
 
//   default_action {
//     type = "fixed-response"
 
//     fixed_response {
//       content_type = "text/plain"
//       message_body = "Hello, World!"
//       status_code  = "200"
//     }
//   }
// }
 
// resource "aws_lb_target_group" "my-target-group" {
//   name     = "my-target-group"
//   port     = 80
//   protocol = "HTTP"
//   vpc_id   =aws_vpc.${req.body.vpc_tag}.id
// }
 
// resource "aws_lb_target_group_attachment" "my-target-attachment" {
//   target_group_arn = aws_lb_target_group.my-target-group.arn
//   target_id        = aws_instance.${req.body.instance_tag}.id
//   port             = 80
// }
 
// `;
// }
 
//     // Write the Terraform configuration to a file
//     fs.appendFileSync("D:/DAT/aws_vpc.tf", tfConfig);
//     // fs.appendFileSync("/home/dys-10156/Videos/DAT/terraform/aws_vpc_output.tf", output);
// }
//     // Define the relative path to the Terraform configuration directory
//     const configPath = "D:/DAT";
 
//     // Change the current working directory to the Terraform configuration directory
//     process.chdir(configPath);
//     exec(
//       "terraform apply -auto-approve -parallelism=10",
//       (applyError, applyStdout, applyStderr) => {
//         if (applyError) {
//           console.error("Terraform apply failed:", applyStderr);
//           return res.status(400).send("Terraform apply failed");
//         } else {
//           console.error("Terraform success:", applyStdout);
//           res
//             .status(200)
//             .json({ message: "VPC created successfully" });
//         }
//       }
//     );
//     }
   
//   } catch (error) {
//     console.log("error is:", error);
//     res.status(400).send("An error occurred (VPC)");
//   }
// }
