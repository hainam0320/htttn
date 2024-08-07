import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    CContainer,
    CRow,
    CCol,
    CButton,
    CTable,
    CTableHead,
    CTableRow,
    CTableHeaderCell,
    CTableBody,
    CTableDataCell,
    CFormInput,
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody,
    CModalFooter
} from '@coreui/react';
import { useParams } from 'react-router-dom';

const AddQuestion = () => {
    const { id } = useParams();
    const [questions, setQuestions] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState(null);
    
    const initialQuestion = {
        id: '',
        test_id: id,
        name: '',
        file: '',
        choices: [
            { id: 'A', content: '' },
            { id: 'B', content: '' },
            { id: 'C', content: '' },
            { id: 'D', content: '' }
        ],
        correct_choice_id: ''
    };

    const [newQuestion, setNewQuestion] = useState(initialQuestion);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await axios.get(`http://localhost:9999/questions?test_id=${id}`);
                setQuestions(response.data);
            } catch (error) {
                console.error('Error fetching questions:', error);
            }
        };

        fetchQuestions();
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'correctAnswer') {
            setNewQuestion({
                ...newQuestion,
                correct_choice_id: value.toUpperCase()
            });
        } else if (name.startsWith('option')) {
            const optionIndex = name === 'optionA' ? 0 : name === 'optionB' ? 1 : name === 'optionC' ? 2 : 3;
            const updatedChoices = [...newQuestion.choices];
            updatedChoices[optionIndex].content = value;
            setNewQuestion({
                ...newQuestion,
                choices: updatedChoices
            });
        } else if (name === 'name') {
            setNewQuestion({
                ...newQuestion,
                name: value
            });
        }
    };

    const addQuestion = async () => {
        try {
            const responseQuestions = await axios.get(`http://localhost:9999/questions`);
            const questionCount = responseQuestions.data;
            const lastQuestionId = questionCount.length > 0 ? Math.max(...questionCount.map(q => q.id)) : 0;
            const newQuestionId = (lastQuestionId + 1).toString();
            const questionToAdd = {
                ...newQuestion,
                id: newQuestionId
            };
            const response = await axios.post(`http://localhost:9999/questions`, questionToAdd);
            setQuestions([...questions, response.data]);
            setNewQuestion(initialQuestion);
            setIsModalVisible(false);

            // Update count_question in the corresponding exam
            await updateExamQuestionCount();
        } catch (error) {
            console.error('Error adding question:', error);
        }
    };

    const deleteQuestion = async () => {
        try {
            await axios.delete(`http://localhost:9999/questions/${questionToDelete}`);
            setQuestions(questions.filter(question => question.id !== questionToDelete));
            setIsDeleteModalVisible(false);
            setQuestionToDelete(null);

            // Update count_question in the corresponding exam
            await updateExamQuestionCount();
        } catch (error) {
            console.error('Error deleting question:', error);
        }
    };

    const updateExamQuestionCount = async () => {
        try {
            const questionsResponse = await axios.get(`http://localhost:9999/questions?test_id=${id}`);
            const countQuestion = questionsResponse.data.length;
            await axios.patch(`http://localhost:9999/exams/${id}`, { count_question: countQuestion });
        } catch (error) {
            console.error('Error updating exam question count:', error);
        }
    };

    const confirmDeleteQuestion = (questionId) => {
        setQuestionToDelete(questionId);
        setIsDeleteModalVisible(true);
    };

    return (
        <CContainer className="bg-white mb-3 custom-borders" fluid>
            <h3 className="text-center pt-3">Thêm Câu Hỏi</h3>
            <hr />
            <CRow className="mt-4">
                <CCol xs="12" className="text-right">
                    <CButton
                        color="primary"
                        className="text-white"
                        onClick={() => setIsModalVisible(true)}
                    >
                        Thêm Câu Hỏi
                    </CButton>
                </CCol>
            </CRow>
            <div className="table-responsive">
                <CTable className="mt-4 table-fixed" bordered borderColor="primary">
                    <CTableHead>
                        <CTableRow className="text-center">
                            <CTableHeaderCell scope="col">STT</CTableHeaderCell>
                            <CTableHeaderCell scope="col" className="fixed-width">Câu hỏi</CTableHeaderCell>
                            <CTableHeaderCell scope="col">Đáp án A</CTableHeaderCell>
                            <CTableHeaderCell scope="col">Đáp án B</CTableHeaderCell>
                            <CTableHeaderCell scope="col">Đáp án C</CTableHeaderCell>
                            <CTableHeaderCell scope="col">Đáp án D</CTableHeaderCell>
                            <CTableHeaderCell scope="col">Đáp án đúng</CTableHeaderCell>
                            <CTableHeaderCell scope="col">Hành động</CTableHeaderCell>
                        </CTableRow>
                    </CTableHead>
                    <CTableBody>
                        {questions.map((question, index) => (
                            <CTableRow key={question.id} className="text-center">
                                <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                                <CTableDataCell className="text-left">{question.name}</CTableDataCell>
                                <CTableDataCell>
                                    {question.choices && question.choices.length > 0 ? question.choices[0].content : ''}
                                </CTableDataCell>
                                <CTableDataCell>
                                    {question.choices && question.choices.length > 1 ? question.choices[1].content : ''}
                                </CTableDataCell>
                                <CTableDataCell>
                                    {question.choices && question.choices.length > 2 ? question.choices[2].content : ''}
                                </CTableDataCell>
                                <CTableDataCell>
                                    {question.choices && question.choices.length > 3 ? question.choices[3].content : ''}
                                </CTableDataCell>
                                <CTableDataCell>{question.correct_choice_id}</CTableDataCell>
                                <CTableDataCell>
                                    <CButton color="danger" onClick={() => confirmDeleteQuestion(question.id)}>
                                        Xóa
                                    </CButton>
                                </CTableDataCell>
                            </CTableRow>
                        ))}
                    </CTableBody>
                </CTable>
            </div>
            {/* Add Question Modal */}
            <CModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                size="lg"
            >
                <CModalHeader closeButton>
                    <CModalTitle>Thêm Câu Hỏi Mới</CModalTitle>
                </CModalHeader>
                <CModalBody>
                    <CFormInput
                        type="text"
                        name="name"
                        value={newQuestion.name}
                        onChange={handleInputChange}
                        placeholder="Nội dung câu hỏi"
                        className="mb-3"
                    />
                    <CFormInput
                        type="text"
                        name="optionA"
                        value={newQuestion.choices[0].content}
                        onChange={handleInputChange}
                        placeholder="Đáp án A"
                        className="mb-3"
                    />
                    <CFormInput
                        type="text"
                        name="optionB"
                        value={newQuestion.choices[1].content}
                        onChange={handleInputChange}
                        placeholder="Đáp án B"
                        className="mb-3"
                    />
                    <CFormInput
                        type="text"
                        name="optionC"
                        value={newQuestion.choices[2].content}
                        onChange={handleInputChange}
                        placeholder="Đáp án C"
                        className="mb-3"
                    />
                    <CFormInput
                        type="text"
                        name="optionD"
                        value={newQuestion.choices[3].content}
                        onChange={handleInputChange}
                        placeholder="Đáp án D"
                        className="mb-3"
                    />
                    <CFormInput
                        type="text"
                        name="correctAnswer"
                        value={newQuestion.correct_choice_id}
                        onChange={handleInputChange}
                        placeholder="Đáp án đúng (A, B, C hoặc D)"
                        className="mb-3"
                    />
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={() => setIsModalVisible(false)}>
                        Hủy
                    </CButton>
                    <CButton color="primary" onClick={addQuestion}>
                        Thêm Câu Hỏi
                    </CButton>
                </CModalFooter>
            </CModal>

            {/* Delete Question Modal */}
            <CModal
                visible={isDeleteModalVisible}
                onClose={() => setIsDeleteModalVisible(false)}
            >
                <CModalHeader closeButton>
                    <CModalTitle>Xác Nhận Xóa Câu Hỏi</CModalTitle>
                </CModalHeader>
                <CModalBody>
                    Bạn có chắc chắn muốn xóa câu hỏi này?
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={() => setIsDeleteModalVisible(false)}>
                        Hủy
                    </CButton>
                    <CButton color="danger" onClick={deleteQuestion}>
                        Xóa
                    </CButton>
                </CModalFooter>
            </CModal>
        </CContainer>
    );
};

export default AddQuestion;
