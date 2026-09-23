import { useRef, useState } from "react";
import Ionicons from "@react-native-vector-icons/ionicons";
import { ActivityIndicator, Image, ImageBackground, Modal, PanResponder, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import ViewShot from "react-native-view-shot";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { radius, theme } from "../theme/theme";
import StatusModal from "./StatusModal";
import { MESSAGE_STYLES, SHARE_TEMPLATES } from "../constants/constant";

const FONT_OPTIONS = [
    {
        id: "classic",
        label: "Classic",
        family: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
    },
    {
        id: "serif",
        label: "Serif",
        family: Platform.OS === "ios"
            ? "Times New Roman"
            : "serif",
    },
    {
        id: "mono",
        label: "Mono",
        family: "monospace",
    },
    {
        id: "medium",
        label: "Medium",
        family: "sans-serif-medium",
    },
];

const TEXT_COLORS = [
    "#FFFFFF",
    "#000000",
    "#7A263A",
    "#9A5B13",
    "#D4AF37",
    "#F5E6C8",
    "#2E5D3B",
];

const FONT_SIZES = [
    { label: "S", value: 16 },
    { label: "M", value: 20 },
    { label: "L", value: 24 },
    { label: "XL", value: 30 },
];

export function ShareComposerModal({
    visible, event, defaultMessage, selectedTemplate, setSelectedTemplate, selectedMessageStyle, selectMessageStyle,
    shareMessage, setShareMessage, customImage, setCustomImage, sharing, setSharing, onClose,
}) {
    const invitationRef = useRef(null);
    const [textColor, setTextColor] = useState("#FFFFFF");
    const [fontSize, setFontSize] = useState(20);
    const [fontFamily, setFontFamily] = useState(Platform.OS === "ios" ? "Helvetica" : "sans-serif");
    const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [textOnly, setTextOnly] = useState(false);
    const [editingTarget, setEditingTarget] = useState("text");
    const [shareMode, setShareMode] = useState("image");

    const message = shareMessage.trim() || defaultMessage;

    const textStartPosition = useRef({ x: 0, y: 0 }).current;
    const imageStartPosition = useRef({ x: 0, y: 0 }).current;

    const [modalDetails, setModalDetails] = useState({ visible: false, title: "", message: "" });

    const closeStatusModal = () => setModalDetails({ visible: false, title: "", message: "" });

    const showStatusModal = (title, message) => {
        setModalDetails({ visible: true, title, message });
    };

    if (!event) return null;

    const activeTemplate = selectedTemplate;
    const backgroundSource = customImage ? { uri: customImage } : activeTemplate?.image;

    const pickCustomImage = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                showStatusModal(
                    "Permission required",
                    "Please allow photo access to choose a background image."
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: false,
                quality: 1,
            });

            if (result.canceled || !result.assets?.length) {
                return;
            }

            setCustomImage(result.assets[0].uri);
        } catch (error) {
            console.error("Image picker error:", error);

            showStatusModal(
                "Could not select image",
                "Please try again."
            );
        }
    };

    const textPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,

            onPanResponderGrant: () => {
                setEditingTarget("text");
                textStartPosition.x = textPosition.x;
                textStartPosition.y = textPosition.y;
            },

            onPanResponderMove: (_, gesture) => {
                setTextPosition({
                    x: textStartPosition.x + gesture.dx,
                    y: textStartPosition.y + gesture.dy,
                });
            },
        })
    ).current;

    const imagePanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,

            onPanResponderGrant: () => {
                setEditingTarget("image");
                imageStartPosition.x = imagePosition.x;
                imageStartPosition.y = imagePosition.y;
            },

            onPanResponderMove: (_, gesture) => {
                setImagePosition({
                    x: imageStartPosition.x + gesture.dx,
                    y: imageStartPosition.y + gesture.dy,
                });
            },
        })
    ).current;

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        setCustomImage?.(null);
    };

    const doShare = async () => {
        const message = shareMessage.trim() || defaultMessage;

        if (!message) {
            setModalDetails({
                visible: true,
                title: "Message required",
                message: "Please enter a message to share.",
            });
            return;
        }

        if (!invitationRef.current) {
            showStatusModal(
                "Please try again",
                "Invitation preview is not ready yet."
            );
            return;
        }

        try {
            setSharing(true);

            if (shareMode === "text") {
                await Share.share({
                    title: event?.title || "Invitation",
                    message,
                });

                onClose?.();
                return;
            }

            if (!invitationRef.current) {
                showStatusModal("Please try again", "Invitation preview is not ready yet.");
                return;
            }

            const uri = await invitationRef.current.capture();
            const available = await Sharing.isAvailableAsync();

            if (!available) {
                showStatusModal("Sharing unavailable", "Image sharing is not available on this device.");
                return;
            }

            await Sharing.shareAsync(
                uri.startsWith("file://") ? uri : `file://${uri}`,
                {
                    mimeType: "image/png",
                    dialogTitle: "Share Invitation",
                    UTI: "public.png",
                }
            );

            onClose?.();
        } catch (error) {
            console.error("Share error:", error);

            showStatusModal(
                "Could not share",
                error?.message ||
                "Something went wrong while creating the invitation."
            );
        } finally {
            setSharing(false);
        }
    };

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                transparent
                onRequestClose={onClose}
            >
                <View style={styles.shareModalOverlay}>
                    <View style={styles.shareModalSheet}>

                        {/* Header */}
                        <View style={styles.shareModalHeader}>
                            <Text style={styles.shareModalTitle}>
                                Share Invitation
                            </Text>

                            <Pressable onPress={onClose} hitSlop={10}>
                                <Ionicons name="close" size={22} color={theme.textMuted} />
                            </Pressable>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >

                            {/* Preview */}
                            <Text style={styles.shareSectionTitle}> Preview</Text>

                            <ViewShot
                                ref={invitationRef}
                                collapsable={false}
                                style={styles.invitationCard}
                                options={{ format: "png", quality: 1, result: "tmpfile" }}
                            >
                                {textOnly ? (
                                    <View style={styles.textOnlyBackground}>
                                        <View
                                            {...textPanResponder.panHandlers}
                                            style={[styles.invitationContent, { transform: [{ translateX: textPosition.x }, { translateY: textPosition.y }] }]}
                                        >
                                            <Text style={[styles.invitationMessage, { color: textColor, fontSize, fontFamily }]}>
                                                {message}
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <ImageBackground
                                        source={backgroundSource}
                                        style={styles.invitationBackground}
                                        imageStyle={[styles.invitationBackgroundImage,
                                        { transform: [{ translateX: imagePosition.x }, { translateY: imagePosition.y },] },
                                        ]}
                                        {...(!textOnly && editingTarget === "image"
                                            ? imagePanResponder.panHandlers
                                            : {})}
                                    >
                                        <View style={styles.invitationOverlay} />

                                        <View style={styles.invitationContent}>

                                            <View
                                                {...textPanResponder.panHandlers}
                                                style={{
                                                    transform: [{ translateX: textPosition.x }, { translateY: textPosition.y }],
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Text style={[styles.invitationTitle, { color: textColor, fontSize, fontFamily }]}>
                                                    {event.title}
                                                </Text>
                                                {/* 
                                                {!!event.event_date && (
                                                    <Text style={[styles.invitationDate, { color: textColor, fontFamily }]}>
                                                        {new Date(event.event_date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                                                    </Text>
                                                )}

                                                {!!event.start_time && (
                                                    <Text style={[styles.invitationTime, { color: textColor, fontFamily }]}>
                                                        {event.start_time}
                                                    </Text>
                                                )} */}

                                                <Text style={[styles.invitationMessage, { color: textColor, fontFamily, }]}>
                                                    {message}
                                                </Text>

                                                {/* <Text
                                                    style={[
                                                        styles.invitationFooter,
                                                        {
                                                            color: textColor,
                                                            fontFamily,
                                                        },
                                                    ]}
                                                >
                                                    Shared from Agam Mandira
                                                </Text> */}
                                            </View>
                                        </View>
                                    </ImageBackground>
                                )}
                            </ViewShot>
                            {/* 
                            <View
                                ref={invitationRef}
                                collapsable={false}
                                style={styles.invitationCard}
                            >
                                <ImageBackground
                                    source={backgroundSource}
                                    style={styles.invitationBackground}
                                    imageStyle={styles.invitationBackgroundImage}
                                >
                                    <View style={styles.invitationOverlay} />

                                    <View style={styles.invitationContent}>
                                        <Text style={styles.invitationTitle}>
                                            {event.title}
                                        </Text>

                                        {!!event.event_date && (
                                            <Text style={styles.invitationDate}>
                                                {new Date(event.event_date).toLocaleDateString(
                                                    undefined,
                                                    {
                                                        weekday: "long",
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                    }
                                                )}
                                            </Text>
                                        )}

                                        {!!event.start_time && (
                                            <Text style={styles.invitationTime}>
                                                {event.start_time}
                                            </Text>
                                        )}

                                        <Text style={styles.invitationMessage}>
                                            {shareMessage.trim() || defaultMessage}
                                        </Text>

                                        <Text style={styles.invitationFooter}>
                                            Shared from Agam Mandira
                                        </Text>
                                    </View>
                                </ImageBackground>
                            </View> */}

                            {/* Image templates */}
                            <Text style={styles.shareSectionTitle}>
                                Background
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.editorOptionList}
                            >
                                <Pressable
                                    style={[styles.editorOption, textOnly && styles.editorOptionSelected,]}
                                    onPress={() => setTextOnly(true)}
                                >
                                    <Ionicons name="text-outline" size={18} color={textOnly ? theme.accent : theme.textMuted} />

                                    <Text style={styles.editorOptionText}>
                                        Text Only
                                    </Text>
                                </Pressable>

                                {SHARE_TEMPLATES.map((template) => {
                                    const selected = !textOnly && !customImage && selectedTemplate?.id === template.id;

                                    return (
                                        <Pressable
                                            key={template.id}
                                            style={[styles.editorOption, selected && styles.editorOptionSelected]}
                                            onPress={() => { setTextOnly(false); handleSelectTemplate(template); }}
                                        >
                                            <Image source={template.image} style={styles.editorOptionImage} />

                                            <Text style={styles.editorOptionText}>
                                                {template.name}
                                            </Text>
                                        </Pressable>
                                    );
                                })}

                                <Pressable
                                    style={[styles.editorOption, customImage && styles.editorOptionSelected,]}
                                    onPress={() => { setTextOnly(false); pickCustomImage(); }}
                                >
                                    <Ionicons name="image-outline" size={18} color={theme.textMuted} />

                                    <Text style={styles.editorOptionText}>
                                        My Photo
                                    </Text>
                                </Pressable>
                            </ScrollView>

                            {/* Text color */}
                            <Text style={styles.shareSectionTitle}>
                                Text color
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.colorList}
                            >
                                {TEXT_COLORS.map((color) => (
                                    <Pressable
                                        key={color}
                                        onPress={() => setTextColor(color)}
                                        style={[styles.colorButton, { backgroundColor: color }, textColor === color && styles.colorButtonSelected,]}
                                    />
                                ))}
                            </ScrollView>

                            <Text style={styles.shareSectionTitle}>
                                Font
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.editorOptionList}
                            >
                                {FONT_OPTIONS.map((font) => {
                                    const selected =
                                        font.family === fontFamily;

                                    return (
                                        <Pressable
                                            key={font.id}
                                            onPress={() => setFontFamily(font.family)}
                                            style={[styles.fontButton, selected && styles.fontButtonSelected]}
                                        >
                                            <Text style={{ fontFamily: font.family, color: theme.text }} >
                                                {font.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>

                            <Text style={styles.shareSectionTitle}>
                                Text size
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.editorOptionList}
                            >
                                {FONT_SIZES.map((size) => {
                                    const selected = fontSize === size.value;

                                    return (
                                        <Pressable key={size.label} onPress={() => setFontSize(size.value)} style={[styles.fontButton, selected && styles.fontButtonSelected]}>
                                            <Text style={{ fontSize: size.value > 24 ? 16 : 14, color: theme.text, }}>
                                                {size.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>

                            <Text style={styles.shareSectionTitle}>
                                Move
                            </Text>

                            <View style={styles.moveModeContainer}>
                                <Pressable
                                    onPress={() => setEditingTarget("text")}
                                    style={[styles.moveModeButton, editingTarget === "text" && styles.moveModeButtonSelected]}
                                >
                                    <Ionicons name="text-outline" size={16} color={theme.text} />
                                    <Text style={styles.moveModeText}>
                                        Move Text
                                    </Text>
                                </Pressable>

                                {!textOnly && (
                                    <Pressable
                                        onPress={() => setEditingTarget("image")}
                                        style={[styles.moveModeButton, editingTarget === "image" && styles.moveModeButtonSelected]}
                                    >
                                        <Ionicons name="image-outline" size={16} color={theme.text}
                                        />
                                        <Text style={styles.moveModeText}>
                                            Move Image
                                        </Text>
                                    </Pressable>
                                )}
                            </View>

                            {/* Message styles */}
                            <Text style={styles.shareSectionTitle}>
                                Message style
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.messageStyleList}
                            >
                                {MESSAGE_STYLES.map((style) => {
                                    const selected = selectedMessageStyle?.id === style.id;
                                    return (
                                        <Pressable
                                            key={style.id}
                                            onPress={() => selectMessageStyle(style)}
                                            style={[styles.messageStyleButton, selected && styles.messageStyleButtonSelected,]}
                                        >
                                            <Text style={[styles.messageStyleText, selected && styles.messageStyleTextSelected,]}>
                                                {style.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                            <Text style={[styles.messageHint, { marginTop: 10, fontWeight: 600 }]}>
                                **If you want to change the message style then select above options**
                            </Text>

                            {/* Message */}
                            <View style={styles.messageHeader}>
                                <Text style={styles.shareSectionTitle}>
                                    Message
                                </Text>

                                <Text style={styles.messageHint}>
                                    You can edit this
                                </Text>
                            </View>

                            <TextInput
                                value={shareMessage}
                                onChangeText={setShareMessage}
                                multiline
                                textAlignVertical="top"
                                placeholder="Write your message..."
                                placeholderTextColor={theme.textMuted}
                                style={styles.shareMessageInput}
                            />

                            <Text style={styles.shareSectionTitle}>
                                Share as
                            </Text>

                            <View style={styles.shareModeContainer}>
                                <Pressable
                                    onPress={() => setShareMode("image")}
                                    style={[
                                        styles.shareModeButton,
                                        shareMode === "image" &&
                                        styles.shareModeButtonSelected,
                                    ]}
                                >
                                    <Ionicons
                                        name="image-outline"
                                        size={18}
                                        color={
                                            shareMode === "image"
                                                ? theme.primary
                                                : theme.textMuted
                                        }
                                    />

                                    <Text
                                        style={[
                                            styles.shareModeText,
                                            shareMode === "image" &&
                                            styles.shareModeTextSelected,
                                        ]}
                                    >
                                        Invitation Image
                                    </Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => setShareMode("text")}
                                    style={[
                                        styles.shareModeButton,
                                        shareMode === "text" &&
                                        styles.shareModeButtonSelected,
                                    ]}
                                >
                                    <Ionicons
                                        name="text-outline"
                                        size={18}
                                        color={
                                            shareMode === "text"
                                                ? theme.accent
                                                : theme.textMuted
                                        }
                                    />

                                    <Text
                                        style={[
                                            styles.shareModeText,
                                            shareMode === "text" &&
                                            styles.shareModeTextSelected,
                                        ]}
                                    >
                                        Text Only
                                    </Text>
                                </Pressable>
                            </View>

                            {/* Share */}
                            <Pressable
                                style={[styles.finalShareButton, sharing && { opacity: 0.6 }]}
                                onPress={doShare}
                                disabled={sharing}
                            >
                                {sharing ? (
                                    <>
                                        <ActivityIndicator color="#fff" />

                                        <Text style={styles.finalShareButtonText}>
                                            {shareMode === "text" ? "Opening share..." : "Creating invitation..."}
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="share-outline" size={18} color="#fff" />

                                        <Text style={styles.finalShareButtonText}>
                                            {shareMode === "text" ? "Share Text" : "Share Invitation"}
                                        </Text>
                                    </>
                                )}
                            </Pressable>

                        </ScrollView>
                    </View>
                </View>
            </Modal>
            <StatusModal
                visible={modalDetails.visible}
                type="error"
                title={modalDetails.title}
                message={modalDetails.message}
                primaryLabel="OK"
                onPrimary={closeStatusModal}
                onRequestClose={closeStatusModal}
                autoClose={false}
            />
        </>
    );
}
const styles = StyleSheet.create({
    shareModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(51,40,31,0.5)',
        justifyContent: 'flex-end',
    },

    shareModalSheet: {
        backgroundColor: theme.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 16,
        maxHeight: '94%',
    },

    shareModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },

    shareModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
    },

    shareSectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.text,
        marginTop: 12,
        marginBottom: 8,
    },

    sharePreview: {
        width: '100%',
        height: 230,
        borderRadius: radius.l,
        overflow: 'hidden',
        backgroundColor: theme.surfaceAlt,
    },

    sharePreviewImage: {
        width: '100%',
        height: '100%',
    },

    sharePreviewOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },

    sharePreviewTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },

    sharePreviewDate: {
        color: '#fff',
        fontSize: 12,
        marginTop: 3,
    },

    templateList: {
        gap: 10,
        paddingVertical: 3,
    },

    templateItem: {
        width: 105,
        position: 'relative',
    },

    templateItemSelected: {
        transform: [{ scale: 1.02 }],
    },

    templateImage: {
        width: 105,
        height: 75,
        borderRadius: 10,
    },

    templateName: {
        fontSize: 11,
        color: theme.text,
        marginTop: 5,
        textAlign: 'center',
    },

    templateCheck: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },

    uploadImageBox: {
        width: 105,
        height: 75,
        borderRadius: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.surfaceAlt,
    },

    uploadText: {
        fontSize: 10,
        color: theme.textMuted,
        marginTop: 3,
    },

    messageStyleList: {
        gap: 8,
        paddingVertical: 3,
    },

    messageStyleButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
    },

    messageStyleButtonSelected: {
        backgroundColor: theme.accentTint,
        borderColor: theme.accent,
    },

    messageStyleText: {
        fontSize: 12,
        color: theme.text,
    },

    messageStyleTextSelected: {
        color: theme.accentDeep,
        fontWeight: '600',
    },

    messageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    messageHint: {
        fontSize: 11,
        color: theme.text,
    },

    shareMessageInput: {
        minHeight: 120,
        maxHeight: 190,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border,
        borderRadius: radius.m,
        padding: 12,
        fontSize: 13,
        lineHeight: 19,
        color: theme.text,
        backgroundColor: theme.surfaceAlt,
    },

    finalShareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.primary,
        borderRadius: radius.m,
        paddingVertical: 13,
        marginTop: 16,
    },

    finalShareButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    invitationCard: {
        width: "100%",
        aspectRatio: 4 / 5,
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: "#ddd",
    },

    invitationBackground: {
        width: "100%",
        height: "100%",
    },

    invitationBackgroundImage: {
        resizeMode: "cover",
    },

    invitationOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.30)",
    },

    invitationContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 28,
        paddingVertical: 30,
    },

    invitationTitle: {
        color: "#fff",
        fontSize: 26,
        fontWeight: "800",
        textAlign: "center",
        textShadowColor: "rgba(0,0,0,0.55)",
        textShadowOffset: {
            width: 0,
            height: 2,
        },
        textShadowRadius: 4,
    },

    invitationDate: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
        marginTop: 12,
    },

    invitationTime: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
        marginTop: 4,
    },

    invitationMessage: {
        color: "#fff",
        fontSize: 15,
        lineHeight: 22,
        textAlign: "center",
        marginTop: 20,
    },

    invitationFooter: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 10,
        marginTop: "auto",
        textAlign: "center",
    },

    editorOptionList: {
        gap: 8,
        paddingVertical: 4,
    },

    editorOption: {
        minWidth: 74,
        height: 68,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
    },

    editorOptionSelected: {
        borderColor: theme.primary,
        backgroundColor: theme.primaryTint,
    },

    editorOptionImage: {
        width: 42,
        height: 38,
        borderRadius: 7,
    },

    editorOptionText: {
        fontSize: 10,
        color: theme.text,
        textAlign: "center",
    },

    colorList: {
        gap: 10,
        paddingVertical: 4,
        paddingLeft: 4
    },

    colorButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: theme.surface,
    },

    colorButtonSelected: {
        borderColor: theme.accent,
        transform: [{ scale: 1.12 }],
    },

    fontButton: {
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
    },

    fontButtonSelected: {
        backgroundColor: theme.primaryTint,
        borderColor: theme.primary,
    },

    moveModeContainer: {
        flexDirection: "row",
        gap: 8,
    },

    moveModeButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.border,
    },

    moveModeButtonSelected: {
        backgroundColor: theme.primaryTint,
        borderColor: theme.primary,
    },

    moveModeText: {
        fontSize: 12,
        color: theme.text,
    },

    textOnlyBackground: {
        flex: 1,
        backgroundColor: "#FCFAF6",
        justifyContent: "center",
        alignItems: "center",
    },
    shareModeContainer: {
        flexDirection: "row",
        gap: 10,
    },

    shareModeButton: {
        flex: 1,
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 12,
        backgroundColor: theme.surface,
        paddingHorizontal: 10,
    },

    shareModeButtonSelected: {
        borderColor: theme.primary,
        backgroundColor: theme.primaryTint,
    },

    shareModeText: {
        fontSize: 12,
        fontWeight: "600",
        color: theme.text,
    },

    shareModeTextSelected: {
        color: theme.primary,
    },
})