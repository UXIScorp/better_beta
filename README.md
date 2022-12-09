# better_beta
P2P WebRTC(presented by PMO, UXIS)

PMO의 의뢰로 UXIS에서 제작한 WebRTC기반 화상회의 서비스입니다.

<간단 매뉴얼>
1. 호환되는 버전의 노드를 설치합니다.(적용버전 : 10.24.1)
 - yum install –y gcc-c++ make
 - curl -sL https://rpm.nodesource.com/setup_10.x | bash -
 - yum install nodejs
2. SSL 인증파일을 업로드한 후, 루트 경로의 server.js파일 10번 라인에 있는 options 부분에 SSL 인증파일 경로를 지정합니다.
3. /js/p2p.js를 열어 1번 라인의 socket 부분에 도메인 정보를 입력하고, 15번 라인의 config 부분에 턴서버 정보를 입력합니다.(턴서버 구축은 검색 참조)
4. 루트 경로에서 server.js를 실행합니다.
