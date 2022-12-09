const pool = require('./dbUtil');

//모든 방 리스트 출력
exports.selectRoomAll = async () => {
    const conn = await pool.getConnection(async connection => connection);
    const query = "SELECT *, (SELECT COUNT(DISTINCT(user_name)) FROM beta_user WHERE room_id = beta_room.room_id) AS cnt FROM beta_room GROUP BY room_id ORDER BY room_seq DESC";
    const result = await conn.query(query);
    conn.release();
    return result[0];
}

//날짜로 방 리스트 검색
exports.selectRoomByDate = async (dateData) => {
    const conn = await pool.getConnection(async connection => connection);
    const query = "SELECT *, (SELECT COUNT(DISTINCT(user_name)) FROM beta_user WHERE room_id = beta_room.room_id) AS cnt FROM beta_room GROUP BY room_id HAVING regi_time >= ? AND drop_time <= ? ORDER BY room_seq DESC";
    const result = await conn.query(query, [dateData.regi_time, dateData.drop_time]);
    conn.release();
    return result[0];
}

//인트로 로그 저장
exports.insertLog = async (ip) => {
    const conn = await pool.getConnection(async connection => connection);
    const query = "INSERT INTO beta_log (log_ip, regi_time) VALUES (?, now())";
    const result = await conn.query(query, ip);
    conn.release();
    return result;
}

//유저입장데이터 저장
exports.insertUserData = async (userData) => {
    const conn = await pool.getConnection(async connection => connection);
    const query = "INSERT INTO beta_user (user_name, user_ip, host_id, room_id, enter_time) VALUES (?, ?, ?, ?, ?)";
    const result = await conn.query(query, [userData.user_name, userData.user_ip, userData.host_id, userData.room_id, userData.enter_time]);
    conn.release();
    return result;
}

//유저퇴장데이터 저장
exports.updateExitTime = async (exitData) => {
    const conn = await pool.getConnection(async connection => connection);
    const query = "UPDATE beta_user SET exit_time = ? WHERE room_id = ? AND user_name = ?";
    const result = await conn.query(query, [exitData.exit_time, exitData.room_id, exitData.user_name]);
    conn.release();
    return result;
}

//방 드랍시간 저장
exports.updateDropTime = async (roomData) => {
    const conn = await pool.getConnection(async connection => connection);
    const query = "UPDATE beta_room SET drop_time = ? WHERE room_seq = (SELECT seq FROM (SELECT MAX(room_seq) AS seq FROM beta_room WHERE regi_id = ?) AS A_T) AND room_id = ?";
    const result = await conn.query(query, [roomData.drop_time, roomData.user_name, roomData.room_id]);
    conn.release();
    return result;
}

// 방 정보 조회
exports.selectRoom = async (ROOM_ID) => {
    const conn = await pool.getConnection(async connection => connection);
    const query = "SELECT * FROM beta_room WHERE room_seq = (SELECT MAX(room_seq) FROM beta_room WHERE room_id = ?)";
    const result = await conn.query(query, ROOM_ID);
    conn.release();
    return result[0][0];
}

//메세지 조회
exports.selectMessage = async (idx) => {
    const conn = await pool.getConnection(async connection => connection);
    const query = "SELECT * FROM beta_chat WHERE room_id = ?";
    const result = await conn.query(query, idx);
    conn.release();
    return result[0];
}

exports.insertMessage = async (data) => {
    const conn = await pool.getConnection(async connection => connection);
    const query = "INSERT INTO beta_chat (room_id, user_name, msg, msg_time, user_idx) VALUES (?, ?, ?, NOW(), ?)";
    const result = await conn.query(query, [data.roomId, data.loginId, data.message, data.loginId]);
    conn.release();
    return result;
}

// 기본 방 정보 등록
exports.insertBasicRoom = async (ROOM) => {
    const conn = await pool.getConnection(async connection => connection);
    const query = "INSERT INTO beta_room SET ?";
    const result = await conn.query(query, ROOM);
    conn.release();
    return result;
}

//모든 방로그 조회
exports.selectClassList = async (id) => {
    const conn = await pool.getConnection(async connection => connection);
    const query = "SELECT room_seq, room_id, room_data, CONVERT_TZ(regi_time, \"+0:00\", \"+9:00\")AS regi_time, CONVERT_TZ(drop_time, \"+0:00\", \"+9:00\")AS drop_time FROM beta_room ORDER BY room_seq DESC";
    const result = await conn.query(query);
    conn.release();
    return result[0];
}