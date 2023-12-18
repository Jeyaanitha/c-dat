const { database, Sequelize } = require("../connection/postgres");

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        uuid: {
            type: DataTypes.UUID,
            primarykey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // createdAt: {
        //     type: DataTypes.DATE,
        //     defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        //     allowNull: false
        // },
       
        S3_Url: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false
        },
        region: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        timeStamps: true
    })
    return User
}