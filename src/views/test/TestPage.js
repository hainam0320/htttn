import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '@fortawesome/fontawesome-free/css/all.min.css';
import {
    CNav,
    CNavItem,
    CNavLink,
    CTabContent,
    CTabPane,
    CContainer,
    CRow,
    CCol,
    CCallout,
    CButton,
    CTable,
    CTableHead,
    CTableRow,
    CTableHeaderCell,
    CTableBody,
    CTableDataCell,
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody,
    CModalFooter,
    CFormInput,
    CTooltip,
    CPagination,
    CPaginationItem
} from '@coreui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import AddMemberModal from './add-member/AddMemberModal';
import DetailTestPage from './DetailTestPage';
import QuizView from '../quiz/Quizview';

const getLoggedInUserId = () => {
    return localStorage.getItem('loggedInUserId');
};

const TestList = () => {
    const [tabPaneActiveKey, setTabPaneActiveKey] = useState(1);
    const [lstTestUser, setLstTestUser] = useState([]);
    const [myTests, setMyTests] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentTest, setCurrentTest] = useState(null);
    const [modalDeleteTest, setModalDeleteTest] = useState(false);
    const [currentTestId, setCurrentTestId] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const userId = getLoggedInUserId();
    const [matchedExams, setMatchedExams] = useState([]);
    const [currentPage, setCurrentPage] = useState(1); // New state for current page
    const itemsPerPage = 5; // Number of items per page

    const changeTab = (key) => {
        setTabPaneActiveKey(key);
        // Navigate to the corresponding path when clicking on tabs
        if (key === 1) {
            navigate('/test'); // Path for tab 1
        } else if (key === 2) {
            navigate('/my-tests'); // Path for tab 2
        }
    };

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const response = await axios.get('http://localhost:9999/exams');
                setLstTestUser(response.data);
                const lstExam = response.data;
                const matched = [];
                for (const itemExam of lstExam) {
                    const response = await axios.get(`http://localhost:9999/user_exam?id_exam=${itemExam.id}`);
                    response.data.forEach(item => {
                        if (item.id_user.includes(userId)) {
                            matched.push(itemExam);
                        }
                    });
                }
                setMatchedExams(matched);
                console.log("Bài thi:", matched);
            } catch (error) {
                console.error('Error fetching test data:', error);
            }
        };

        fetchTests();
    }, []);

    useEffect(() => {
        if (location.state && location.state.refresh) {
            const fetchMyTests = async () => {
                try {
                    const response = await axios.get('http://localhost:9999/my-exams');
                    setMyTests(response.data);
                } catch (error) {
                    console.error('Error fetching my tests data:', error);
                }
            };

            fetchMyTests();
        }
    }, [location.state]);

    const openAddMemberModal = (testId) => {
        setCurrentTestId(testId);
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setSelectedUsers([]);
    };

    const openDeleteModal = (testId) => {
        setCurrentTestId(testId);
        setModalDeleteTest(true);
    };

    const deleteTest = async () => {
        try {
            const response = await axios.get(`http://localhost:9999/questions?test_id=${currentTestId}`);
            const questionsToDelete = response.data;
            await Promise.all(questionsToDelete.map(async (question) => {
                await axios.delete(`http://localhost:9999/questions/${question.id}`);
            }));
            await axios.delete(`http://localhost:9999/exams/${currentTestId}`);
            setLstTestUser(lstTestUser.filter(test => test.id !== currentTestId));
            setModalDeleteTest(false);
        } catch (error) {
            console.error('Error deleting test:', error);
        }
    };

    const handleSearch = () => {
        let filtered = lstTestUser;
        if (searchKeyword) {
            filtered = lstTestUser.filter(test =>
                test.name.toLowerCase().includes(searchKeyword.toLowerCase())
            );
        }
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filtered.slice(startIndex, endIndex);
    };

    const filteredTests = handleSearch();

    const totalPages = Math.ceil(lstTestUser.length / itemsPerPage);

    return (
        <div>
            <CNav variant="tabs" role="tablist">
                <CNavItem>
                    <CNavLink
                        active={tabPaneActiveKey === 1}
                        onClick={() => changeTab(1)}
                    >
                        Bài thi
                    </CNavLink>
                </CNavItem>
                <CNavItem>
                    <CNavLink
                        active={tabPaneActiveKey === 2}
                        onClick={() => changeTab(2)}
                    >
                        Bài thi của tôi
                    </CNavLink>
                </CNavItem>
            </CNav>

            <CTabContent>
                <CTabPane visible={tabPaneActiveKey === 1}>
                    <CContainer className="bg-white mb-3 custom-borders" fluid>
                        <h3 className="text-center pt-3">DANH SÁCH BÀI THI CẦN LÀM</h3>
                        <hr />
                        <CRow>
                            {matchedExams.map((test) => (
                                <CCol key={test.id} xs="12" sm="12" md="6">
                                    <CCallout color="success custom-callout">
                                        <div>
                                            <h4 className="text-uppercase">{test.name}</h4>
                                            <span>Số câu hỏi: {test.count_question}</span>
                                            <br />
                                            <span>Thời gian làm bài: {test.time_work} phút</span>
                                            <br />
                                            <span>Người giao bài: admin</span>
                                        </div>
                                        <div className="mt-md-0">
                                            {test.result == null ? (
                                                new Date(test.time_end) > new Date() ? (
                                                    <CButton
                                                        color="primary"
                                                        onClick={() => {
                                                            setCurrentTest(test); // Lưu bài thi hiện tại vào state
                                                            setIsModalVisible(true); // Hiển thị modal
                                                            navigate('/quiz/view/' + test.id);
                                                        }}
                                                    >
                                                        <i className="fas fa-book-reader"></i> Làm bài
                                                    </CButton>
                                                ) : (
                                                    <CButton color="danger" className="text-white" disabled>
                                                        <i className="fas fa-exclamation-triangle"></i> Quá hạn
                                                    </CButton>
                                                )
                                            ) : (
                                                <CButton
                                                    color="success"
                                                    onClick={() => {
                                                        setCurrentTest(test); // Lưu bài thi hiện tại vào state
                                                        setIsModalVisible(true); // Hiển thị modal
                                                    }}
                                                    className="text-white"
                                                >
                                                    <i className="fas fa-check"></i> Hoàn thành
                                                </CButton>
                                            )}
                                        </div>
                                    </CCallout>
                                </CCol>
                            ))}
                        </CRow>
                    </CContainer>
                    {/* Ensure the modal is rendered only when currentTest is set */}
                    {currentTest && (
                        <DetailTestPage
                            visible={isModalVisible}
                            closeModal={closeModal}
                            test={currentTest}
                        />
                    )}
                </CTabPane>

                <CTabPane visible={tabPaneActiveKey === 2}>
                    <CContainer className="bg-white mb-3 custom-borders" fluid>
                        <h3 className="text-center pt-3">DANH SÁCH BÀI THI CỦA TÔI</h3>
                        <hr />
                        <CRow className="mt-4">
                            <CCol xs="12" md="4">
                                <label className="mb-1">Tên bài thi</label>
                                <CFormInput
                                    value={searchKeyword} // Bind value to state
                                    onChange={(e) => setSearchKeyword(e.target.value)} // Handle change
                                    placeholder="Nhập tên bài thi"
                                />
                            </CCol>
                        </CRow>
                        <CRow className="mt-4">
                            <CCol xs="9">
                                <CButton
                                    color="primary"
                                    className="text-white"
                                    onClick={() => navigate('/test/create')}
                                >
                                    Thêm mới
                                </CButton>
                            </CCol>
                        </CRow>
                        <div className="table-responsive">
                            <CTable className="mt-4 table-fixed" bordered borderColor="primary">
                                <CTableHead>
                                    <CTableRow className="text-center">
                                        <CTableHeaderCell scope="col">STT</CTableHeaderCell>
                                        <CTableHeaderCell scope="col" className="fixed-width">Tên</CTableHeaderCell>
                                        <CTableHeaderCell scope="col">Số câu hỏi</CTableHeaderCell>
                                        <CTableHeaderCell scope="col">Thời gian làm</CTableHeaderCell>
                                        <CTableHeaderCell scope="col">Thời gian bắt đầu</CTableHeaderCell>
                                        <CTableHeaderCell scope="col">Hạn kết thúc</CTableHeaderCell>
                                        <CTableHeaderCell scope="col" className="fixed-width">Thao tác</CTableHeaderCell>
                                    </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                    {filteredTests.map((test, index) => (
                                        <CTableRow key={test.id} className="text-center">
                                            <CTableHeaderCell scope="row">{(currentPage - 1) * itemsPerPage + index + 1}</CTableHeaderCell>
                                            <CTableDataCell className="text-left">{test.name}</CTableDataCell>
                                            <CTableDataCell>{test.count_question}</CTableDataCell>
                                            <CTableDataCell>{test.time_work} phút</CTableDataCell>
                                            <CTableDataCell>{new Date(test.time_start).toLocaleString()}</CTableDataCell>
                                            <CTableDataCell>{new Date(test.time_end).toLocaleString()}</CTableDataCell>
                                            <CTableDataCell className="d-flex justify-content-between">
                                                <CTooltip content="Thêm thành viên" placement="top">
                                                    <CButton
                                                        color="primary"
                                                        onClick={() => openAddMemberModal(test.id)}
                                                        className="text-white"
                                                    >
                                                        <i className="fas fa-user-plus"></i>
                                                    </CButton>
                                                </CTooltip>
                                                <CTooltip content="Thêm câu hỏi" placement="top">
                                                    <CButton
                                                        color="info"
                                                        onClick={() => navigate(`/quiz/create/${test.id}`)}
                                                        className="text-white"
                                                    >
                                                        <i className="fas fa-book-medical"></i>
                                                    </CButton>
                                                </CTooltip>
                                                <CTooltip content="Xem" placement="top">
                                                    <CButton
                                                        color="success"
                                                        onClick={() => navigate(`/test/detail/${test.id}`)}
                                                        className="text-white"
                                                    >
                                                        <i className="far fa-eye"></i>
                                                    </CButton>
                                                </CTooltip>
                                                <CTooltip content="Sửa" placement="top">
                                                    <CButton
                                                        color="warning"
                                                        onClick={() => navigate(`/test/edit/${test.id}`)}
                                                        className="text-white"
                                                    >
                                                        <i className="far fa-edit"></i>
                                                    </CButton>
                                                </CTooltip>
                                                <CTooltip content="Xóa" placement="top">
                                                    <CButton
                                                        color="danger"
                                                        onClick={() => openDeleteModal(test.id)}
                                                        className="text-white"
                                                    >
                                                        <i className="far fa-trash-alt"></i>
                                                    </CButton>
                                                </CTooltip>
                                            </CTableDataCell>
                                        </CTableRow>
                                    ))}
                                </CTableBody>
                            </CTable>
                        </div>
                        {/* Pagination Controls */}
                        <CPagination align="end" className="mt-3">
                            <CPaginationItem
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(currentPage - 1)}
                            >
                                Previous
                            </CPaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <CPaginationItem
                                    key={i + 1}
                                    active={currentPage === i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </CPaginationItem>
                            ))}
                            <CPaginationItem
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(currentPage + 1)}
                            >
                                Next
                            </CPaginationItem>
                        </CPagination>
                    </CContainer>
                    {/* Ensure the modal is rendered only when currentTest is set */}
                    {currentTest && (
                        <DetailTestPage
                            visible={isModalVisible}
                            closeModal={closeModal}
                            test={currentTest}
                        />
                    )}
                </CTabPane>
            </CTabContent>

            {/* Add Member Modal */}
            <AddMemberModal
                visible={isModalVisible && !currentTest}
                closeModal={closeModal}
                testId={currentTestId}
            />
            {/* Modal (hiển thị danh sách câu hỏi trong bài thi khi làm bài) */}
            {currentTest && (
                <CModal
                    visible={isModalVisible}
                    onClose={closeModal}
                    size="lg"
                >
                    <CModalHeader closeButton>
                        <CModalTitle>{currentTest.name}</CModalTitle>
                    </CModalHeader>
                    <CModalBody>
                        {/* Truyền currentTest vào component QuizView để hiển thị câu hỏi */}
                        <QuizView test={currentTest} />
                    </CModalBody>
                    <CModalFooter>
                        <CButton color="secondary" onClick={closeModal}>
                            Đóng
                        </CButton>
                    </CModalFooter>
                </CModal>
            )}
            {/* Delete Modal */}
            <CModal
                visible={modalDeleteTest}
                onClose={() => setModalDeleteTest(false)}
                aria-labelledby="DeleteTestModal"
            >
                <CModalHeader>
                    <CModalTitle id="DeleteTestModal">Xác nhận xoá bài thi</CModalTitle>
                </CModalHeader>
                <CModalBody>
                    Bạn có chắc chắn muốn xoá bài thi này không?
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={() => setModalDeleteTest(false)}>
                        Đóng
                    </CButton>
                    <CButton color="danger" onClick={deleteTest}>
                        Xoá
                    </CButton>
                </CModalFooter>
            </CModal>
        </div>
    );
};

export default TestList;
