// CafeKiosk.js

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./Kiosk.css";
import { db, storage } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { AnimatePresence, motion } from "framer-motion";

// 한 페이지에 표시할 메뉴 수
const ITEMS_PER_PAGE = 4;

// 개별 메뉴 항목을 드래그 가능하게 만드는 DraggableMenuItem
const DraggableMenuItem = ({ item, index, updateMenuItem, deleteMenuItem }) => {
  return (
    <Draggable draggableId={item.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          className={`menu-item ${snapshot.isDragging ? "dragging" : ""}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            ...provided.draggableProps.style,
          }}
        >
          <div className="admin-buttons">
            <input
              type="file"
              onChange={(e) => {
                updateMenuItem(item.id, "image", e.target.files[0]);
              }}
              className="menu-item-upload"
            />
            <button
              onClick={() => {
                deleteMenuItem(item.id);
              }}
              className="delete-btn"
            >
              삭제
            </button>
          </div>
          {/* 드래그 핸들로 사용할 요소 */}
          <div className="drag-handle" {...provided.dragHandleProps}>
            <img
              src={item.image || "default-image.jpg"}
              alt={item.name}
              className="menu-item-image"
              draggable="false" // 이미지의 기본 드래그 동작 비활성화
            />
            {/* 드래그 아이콘 추가 */}
            <div className="drag-icon">≡</div>
          </div>
          <h3 className="menu-item-name">
            <input
              type="text"
              value={item.name}
              onChange={(e) => {
                updateMenuItem(item.id, "name", e.target.value);
              }}
              className="menu-item-input"
              placeholder="메뉴 이름"
            />
          </h3>
          <p className="menu-item-price">
            <input
              type="number"
              value={item.price}
              onChange={(e) => {
                updateMenuItem(item.id, "price", Number(e.target.value));
              }}
              className="menu-item-input"
              step="100"
              placeholder="가격"
            />
          </p>
        </div>
      )}
    </Draggable>
  );
};

const CafeKiosk = ({ isAdminMode, userEmail, signal }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // 초기 선택된 카테고리 없음
  const [menuItems, setMenuItems] = useState([]);
  const [menuTitle, setMenuTitle] = useState(""); // 메뉴 제목 상태 추가
  const [currentPage, setCurrentPage] = useState(0); // 현재 페이지 번호

  // Firestore에서 데이터 불러오기
  useEffect(() => {
    if (!signal) return; // signal가 없으면 리턴

    const fetchData = async () => {
      const kioskDocRef = doc(db, "kiosk", signal);
      const docSnap = await getDoc(kioskDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setCategories(data.categories || ["카테고리1", "카테고리2", "카테고리3"]);
        setMenuItems(data.menuItems || []);
        setMenuTitle(data.menuTitle || ""); // menuTitle 불러오기
        setSelectedCategory(data.categories ? data.categories[0] : "카테고리1"); // 첫 번째 카테고리 선택
        setCurrentPage(0); // 페이지 초기화
      } else {
        if (isAdminMode) {
          // 문서가 존재하지 않으면 생성
          const initialData = {
            categories: ["카테고리1", "카테고리2", "카테고리3"],
            menuItems: [],
            menuTitle: "카페 메뉴", // menuTitle 추가
          };
          await setDoc(kioskDocRef, initialData);
          setCategories(initialData.categories);
          setMenuItems(initialData.menuItems);
          setMenuTitle(initialData.menuTitle); // menuTitle 설정
          setSelectedCategory(initialData.categories[0]);
          setCurrentPage(0);
        } else {
          alert("키오스크 데이터를 불러올 수 없습니다.");
        }
      }
    };
    fetchData();
  }, [signal, isAdminMode]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(0); // currentPage를 0으로 재설정
  };

  // 현재 페이지에 표시할 메뉴 아이템 필터링
  const filteredItems = menuItems.filter((item) => item.category === selectedCategory);
  const paginatedMenuItems = filteredItems.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const addMenuItem = async () => {
    if (!isAdminMode) return; // 관리자가 아닌 경우 실행하지 않음

    const newItem = {
      id: Date.now(),
      category: selectedCategory,
      name: "새로운 메뉴",
      price: 0,
      image: "",
    };
    const updatedItems = [...menuItems, newItem];
    setMenuItems(updatedItems);

    const kioskDocRef = doc(db, "kiosk", signal.toString());
    await setDoc(kioskDocRef, { menuItems: updatedItems }, { merge: true });
  };

  const deleteMenuItem = async (id) => {
    if (!isAdminMode) return; // 관리자가 아닌 경우 실행하지 않음

    const updatedItems = menuItems.filter((item) => item.id !== id);
    setMenuItems(updatedItems);
    const kioskDocRef = doc(db, "kiosk", signal.toString());

    await setDoc(kioskDocRef, { menuItems: updatedItems }, { merge: true });
  };

  const updateMenuItem = async (id, key, value) => {
    if (!isAdminMode) return; // 관리자가 아닌 경우 실행하지 않음

    const updatedItems = menuItems.map((item) =>
      item.id === id ? { ...item, [key]: value } : item
    );
    setMenuItems(updatedItems);

    const kioskDocRef = doc(db, "kiosk", signal.toString());
    await setDoc(kioskDocRef, { menuItems: updatedItems }, { merge: true });
  };

  const handleImageUpload = async (id, file) => {
    if (!isAdminMode) return; // 관리자가 아닌 경우 실행하지 않음

    const storageRef = ref(storage, `kiosk/images/${id}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    updateMenuItem(id, "image", downloadURL);
  };

  const onDragEnd = async (result) => {
    if (!isAdminMode) return; // 관리자가 아닌 경우 실행하지 않음
    if (!result.destination) return;

    // 현재 페이지 내에서의 인덱스
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    // 현재 카테고리에 해당하는 전체 아이템들에서의 인덱스
    const sourceGlobalIndex = filteredItems
      .map((item) => item.id)
      .indexOf(paginatedMenuItems[sourceIndex].id);
    const destinationGlobalIndex = filteredItems
      .map((item) => item.id)
      .indexOf(paginatedMenuItems[destinationIndex].id);

    // filteredItems에서 순서 변경
    const newFilteredItems = Array.from(filteredItems);
    const [movedItem] = newFilteredItems.splice(sourceGlobalIndex, 1);
    newFilteredItems.splice(destinationGlobalIndex, 0, movedItem);

    // 전체 menuItems에서 해당 카테고리의 아이템들을 새로운 순서로 대체
    const newMenuItems = menuItems.map((item) => {
      if (item.category === selectedCategory) {
        return newFilteredItems.shift();
      }
      return item;
    });

    setMenuItems(newMenuItems);

    const kioskDocRef = doc(db, "kiosk", signal.toString());
    await setDoc(kioskDocRef, { menuItems: newMenuItems }, { merge: true });
  };

  const addCategory = async () => {
    if (!isAdminMode) return; // 관리자가 아닌 경우 실행하지 않음

    const newCategory = prompt("새 카테고리 이름을 입력하세요:");
    if (newCategory && !categories.includes(newCategory)) {
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);

      // Firestore에 업데이트
      const kioskDocRef = doc(db, "kiosk", signal.toString());
      await setDoc(kioskDocRef, { categories: updatedCategories }, { merge: true });
    }
  };

  const deleteCategory = async (category) => {
    if (!isAdminMode) return; // 관리자가 아닌 경우 실행하지 않음

    if (window.confirm(`${category} 카테고리를 삭제하시겠습니까?`)) {
      const updatedCategories = categories.filter((cat) => cat !== category);
      const updatedItems = menuItems.filter((item) => item.category !== category);
      setCategories(updatedCategories);
      setMenuItems(updatedItems);

      // Firestore에 업데이트
      const kioskDocRef = doc(db, "kiosk", signal.toString());
      await setDoc(
        kioskDocRef,
        {
          categories: updatedCategories,
          menuItems: updatedItems,
        },
        { merge: true }
      );

      // 선택된 카테고리를 첫 번째 카테고리로 변경
      setSelectedCategory(updatedCategories[0] || null);
    }
  };

  const renameCategory = async (category) => {
    if (!isAdminMode) return; // 관리자가 아닌 경우 실행하지 않음

    const newCategoryName = prompt("새 카테고리 이름을 입력하세요:", category);
    if (
      newCategoryName &&
      newCategoryName !== category &&
      !categories.includes(newCategoryName)
    ) {
      // 기존 카테고리 목록 업데이트
      const updatedCategories = categories.map((cat) =>
        cat === category ? newCategoryName : cat
      );
      setCategories(updatedCategories);
      setSelectedCategory(newCategoryName); // 변경된 카테고리 자동 선택

      // menuItems에서 해당 카테고리를 가진 아이템들의 category 속성 업데이트
      const updatedItems = menuItems.map((item) =>
        item.category === category ? { ...item, category: newCategoryName } : item
      );
      setMenuItems(updatedItems);

      // Firestore에 업데이트된 카테고리와 메뉴 저장
      const kioskDocRef = doc(db, "kiosk", signal.toString());
      await setDoc(
        kioskDocRef,
        {
          categories: updatedCategories,
          menuItems: updatedItems,
        },
        { merge: true }
      );
    }
  };

  // 페이지 전환 핸들러
  const handleNextPage = () => {
    if ((currentPage + 1) * ITEMS_PER_PAGE < filteredItems.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 메뉴 제목 변경 핸들러
  const handleTitleChange = async (newTitle) => {
    if (!isAdminMode) return; // 관리자가 아닌 경우 실행하지 않음

    setMenuTitle(newTitle);

    const kioskDocRef = doc(db, "kiosk", signal.toString());
    await setDoc(kioskDocRef, { menuTitle: newTitle }, { merge: true });
  };

  return (
    <div className="kiosk-container">
      {isAdminMode ? (
        <input
          type="text"
          value={menuTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="kiosk-title-input"
          placeholder="키오스크 이름을 입력하세요"
        />
      ) : (
        <h2 className="kiosk-title">{menuTitle}</h2>
      )}

      <div className="category-selector">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${category === selectedCategory ? "active" : ""}`}
            onClick={() => handleCategoryChange(category)}
            onDoubleClick={() => isAdminMode && renameCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {isAdminMode && (
        <div className="admin-controls">
          <button className="add-category-btn" onClick={addCategory}>
            카테고리 추가
          </button>
          <button
            className="delete-category-btn"
            onClick={() => deleteCategory(selectedCategory)}
          >
            카테고리 삭제
          </button>
          <button className="add-menu-btn" onClick={addMenuItem}>
            메뉴 추가
          </button>
          <p className="admin-tip">
            이미지를 눌러 드래그 앤 드롭으로 메뉴를 재배치하세요.
          </p>
        </div>
      )}

      <div className="pagination-controls">
        <button onClick={handlePrevPage} disabled={currentPage === 0}>
          ⬅️
        </button>
        {Array.from({ length: Math.ceil(filteredItems.length / ITEMS_PER_PAGE) }).map(
          (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={currentPage === index ? "active" : ""}
            >
              {index + 1}
            </button>
          )
        )}
        <button
          onClick={handleNextPage}
          disabled={(currentPage + 1) * ITEMS_PER_PAGE >= filteredItems.length}
        >
          ➡️
        </button>
      </div>

      {isAdminMode ? (
        <div>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="menu-grid" direction="vertical">
              {(provided) => (
                <div
                  className="menu-grid"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {paginatedMenuItems.map((item, index) => (
                    <DraggableMenuItem
                      key={item.id}
                      item={item}
                      index={index}
                      updateMenuItem={(id, key, value) => {
                        if (key === "image") {
                          handleImageUpload(id, value);
                        } else {
                          updateMenuItem(id, key, value);
                        }
                      }}
                      deleteMenuItem={deleteMenuItem}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedCategory}-${currentPage}-${isAdminMode}`}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
          >
            <div className="menu-grid">
              {paginatedMenuItems.map((item) => (
                <div key={item.id} className="menu-item">
                  <img
                    src={item.image || "default-image.jpg"}
                    alt={item.name}
                    className="menu-item-image"
                  />
                  <h3 className="menu-item-name">{item.name}</h3>
                  <p className="menu-item-price">₩{item.price.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default CafeKiosk;
