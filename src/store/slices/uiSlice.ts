import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
    sidebarOpen: boolean;
    activeCardId: number | null;  // Card detail drawer
    activeCardListId: number | null;
    createBoardModalOpen: boolean;
    createWorkspaceModalOpen: boolean;
}

const initialState: UiState = {
    sidebarOpen: true,
    activeCardId: null,
    activeCardListId: null,
    createBoardModalOpen: false,
    createWorkspaceModalOpen: false,
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
        setSidebarOpen: (state, action: PayloadAction<boolean>) => { state.sidebarOpen = action.payload; },
        openCardDetail: (state, action: PayloadAction<{ cardId: number; listId: number }>) => {
            state.activeCardId = action.payload.cardId;
            state.activeCardListId = action.payload.listId;
        },
        closeCardDetail: (state) => {
            state.activeCardId = null;
            state.activeCardListId = null;
        },
        setCreateBoardModal: (state, action: PayloadAction<boolean>) => { state.createBoardModalOpen = action.payload; },
        setCreateWorkspaceModal: (state, action: PayloadAction<boolean>) => { state.createWorkspaceModalOpen = action.payload; },
    },
});

export const {
    toggleSidebar, setSidebarOpen,
    openCardDetail, closeCardDetail,
    setCreateBoardModal, setCreateWorkspaceModal,
} = uiSlice.actions;
export default uiSlice.reducer;