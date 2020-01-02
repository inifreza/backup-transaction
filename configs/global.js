module.exports = {
    development: {
        url_cms: 'https://www.eannovate.com/dev72/oneplus/',
        url_crawlOneplus: 'http://eannov8.xyz:8043/',
        url_crawlOneplusImg: 'http://eannov8.xyz:8043/upload/',
        url_img: 'http://eannov8.xyz:9009/upload/',
        firebase : {
            base_url : 'https://fcm.googleapis.com/fcm/send',
            server_key : 'AAAAzZ13Sig:APA91bECKujsyPfeBWTyXNZTjjhcaEXtsoSmXLErr_ARabWvqcndaTjgtoG27qm7xX0GqUYEiKGvzr7zQtDMJJ0-PdpZ6GSbenGsW9QF5L6UkTWKEkaJSLrio-sb-uAR45TUSXWQ6AOL',
        }
    },
    staging: {
        url_cms: 'https://www.eannovate.com/dev72/oneplus/',
        url_remoteOneplus: 'http://eannov8.xyz:8043/',
        url_img: 'http://eannov8.xyz:9009/upload/',
        firebase : {
            base_url : 'https://fcm.googleapis.com/fcm/send',
            server_key : 'AAAAzZ13Sig:APA91bECKujsyPfeBWTyXNZTjjhcaEXtsoSmXLErr_ARabWvqcndaTjgtoG27qm7xX0GqUYEiKGvzr7zQtDMJJ0-PdpZ6GSbenGsW9QF5L6UkTWKEkaJSLrio-sb-uAR45TUSXWQ6AOL',
        }
    },
    production: {
        url_cms: 'https://www.eannovate.com/dev72/oneplus/',
        url_remoteOneplus: 'http://eannov8.xyz:8043/',
        url_img: 'http://eannov8.xyz:9009/upload/',
        firebase : {
            base_url   : 'https://fcm.googleapis.com/fcm/send',
            server_key : '',
        }
    },

    SOCKET_MSG : {
        connection: 'connection',
        disconnect: 'disconnect',
        join: 'join',
        logout: 'logout',
        message: 'message',
        sendMessage: 'sendMessage',
        roomData: 'roomData',
        onlineUsers: 'onlineUsers',
        userSeen: 'userSeen'
    },
      SERVER: {
        error: 'Server Error'
      },
    MSG_TYPE : {
        admin: 0,
        sent: 1,
        received: 2
    }
}